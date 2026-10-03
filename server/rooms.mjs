import { createHash, randomBytes, randomInt, randomUUID } from 'node:crypto';
import gameReducer, { rollDice, finishDiceRoll, movePiece, placePiece } from '../src/store/gameSlice.js';
import { createInitialGameState, PLAYER_COLORS } from '../src/store/gameBoardInit.js';
import { canPieceMove, hasPlayerFinished, isGameOver } from '../src/store/logic/gameRules.js';
import { createInviteOriginResolver } from './inviteOrigin.mjs';
import { DICE_ROLL_DURATION, REPEAT_ROLL_DURATION } from '../src/shared/animationTiming.js';
import { MIN_ROOM_PLAYERS, MAX_ROOM_PLAYERS } from '../src/shared/multiplayerConfig.js';
import { getCharacter } from '../src/shared/characters.js';

const fail = (code, message) => { throw Object.assign(new Error(message), { code }); };
const hashToken = token => createHash('sha256').update(token).digest('hex');
const roomCode = () => Array.from({ length: 6 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[randomInt(32)]).join('');
const normalizeCode = value => typeof value === 'string' ? value.trim().toUpperCase() : '';
const normalizeName = value => {
    if (typeof value !== 'string') fail('BAD_NAME', 'Введите имя игрока.');
    const name = value.trim().replace(/[\u0000-\u001f\u007f]/g, '');
    if (!name || name.length > 24) fail('BAD_NAME', 'Имя должно содержать от 1 до 24 символов.');
    return name;
};
const validateCharacter = id => {
    if (typeof id !== 'string' || !getCharacter(id)) fail('BAD_CHARACTER', 'Выберите одного персонажа перед входом в комнату.');
    return id;
};

export const registerRooms = (io, {
    rollValues = () => [randomInt(1, 7), randomInt(1, 7)],
    rollDuration = sequence => sequence > 3 ? REPEAT_ROLL_DURATION : DICE_ROLL_DURATION,
    roomTtl = 30 * 60_000,
    lobbyGrace = 60_000,
    maxRooms = 1000,
} = {}) => {
    const resolveInviteOrigin = createInviteOriginResolver();
    const rooms = new Map();
    const creationLimits = new Map();
    const timers = new Set();
    const schedule = (callback, duration) => {
        const timer = setTimeout(() => { timers.delete(timer); callback(); }, duration);
        timer.unref(); timers.add(timer); return timer;
    };
    const cancel = timer => { clearTimeout(timer); timers.delete(timer); };
    const snapshot = room => ({
        code: room.code, revision: room.revision, phase: room.phase, hostId: room.hostId,
        paused: room.phase === 'playing' && !isGameOver(room.game) && room.players.some(player => !player.socketId && !hasPlayerFinished(room.game, player.color)),
        players: room.players.map(({ id, name, characterId, color, socketId, disconnectedAt }) => ({ id, name, characterId, color, connected: Boolean(socketId), disconnectedAt: disconnectedAt ?? null,
            result: hasPlayerFinished(room.game, color) ? 'winner' : room.game.loser === color ? 'loser' : null })),
        notice: room.notice ?? null,
        game: room.game,
    });
    const setNotice = (room, player, type) => {
        room.notice = { id: randomUUID(), type, playerId: player.id, name: player.name, color: player.color, at: Date.now() };
    };
    const publish = room => {
        if (room.phase === 'waiting' && (room.game.players.length !== room.players.length
            || room.players.some(member => !room.game.players.some(player => player.color === member.color)))) {
            room.game = createInitialGameState(room.players.map(player => player.color));
        }
        room.revision += 1; room.updatedAt = Date.now();
        io.to(room.code).emit('room:state', snapshot(room));
    };
    const getMembership = socket => {
        const room = rooms.get(socket.data.roomCode);
        const player = room?.players.find(member => member.id === socket.data.playerId && member.socketId === socket.id);
        if (!room || !player) fail('NO_ROOM', 'Сначала войдите в комнату.');
        return { room, player };
    };
    const transferHost = room => {
        if (!room.players.some(player => player.id === room.hostId && player.socketId)) {
            room.hostId = (room.players.find(player => player.socketId) ?? room.players[0])?.id ?? null;
        }
    };
    const finishRoll = (room, id) => {
        cancel(room.rollTimer); room.rollTimer = null;
        room.game = gameReducer(room.game, finishDiceRoll(id));
        publish(room);
    };
    const attach = (socket, room, player) => {
        const previousSocket = io.sockets.sockets.get(player.socketId);
        const returning = Boolean(player.disconnectedAt);
        cancel(player.disconnectTimer); player.disconnectTimer = null;
        player.socketId = socket.id; player.disconnectedAt = null;
        socket.data.roomCode = room.code; socket.data.playerId = player.id;
        socket.join(room.code);
        if (previousSocket && previousSocket.id !== socket.id) {
            previousSocket.emit('session:replaced'); previousSocket.disconnect(true);
        }
        if (returning) setNotice(room, player, 'reconnected');
        transferHost(room); publish(room);
    };
    const addPlayer = (socket, room, name, characterId) => {
        const token = randomBytes(32).toString('base64url');
        const player = {
            id: randomUUID(), name, characterId, tokenHash: hashToken(token), socketId: null,
            color: PLAYER_COLORS.find(color => !room.players.some(member => member.color === color)),
        };
        room.players.push(player);
        setNotice(room, player, 'joined');
        if (!room.hostId) room.hostId = player.id;
        attach(socket, room, player);
        return { session: { roomCode: room.code, playerId: player.id, token }, snapshot: snapshot(room) };
    };
    const restart = room => {
        cancel(room.rollTimer); room.rollTimer = null;
        room.players.filter(player => !player.socketId).forEach(player => cancel(player.disconnectTimer));
        room.players = room.players.filter(player => player.socketId);
        room.game = createInitialGameState(room.players.map(player => player.color)); room.phase = 'waiting';
        transferHost(room); publish(room);
    };

    io.on('connection', socket => {
        let events = 0;
        let windowStart = Date.now();
        const onRequest = (event, handler) => socket.on(event, (payload, acknowledge) => {
            if (typeof acknowledge !== 'function') return;
            try {
                if (Date.now() - windowStart > 10_000) { windowStart = Date.now(); events = 0; }
                if (++events > 40) fail('RATE_LIMIT', 'Слишком много запросов. Подождите несколько секунд.');
                if (!payload || typeof payload !== 'object' || Array.isArray(payload)) fail('BAD_REQUEST', 'Некорректный запрос.');
                const result = handler(payload);
                acknowledge({ ok: true, ...result, ...(result?.session ? { inviteOrigin: resolveInviteOrigin(payload.pageOrigin) } : {}) });
            } catch (error) {
                if (!error.code) console.error('Socket request failed:', error);
                const room = rooms.get(socket.data.roomCode);
                acknowledge({ ok: false, error: { code: error.code ?? 'SERVER_ERROR', message: error.code ? error.message : 'Ошибка сервера. Повторите запрос.' }, ...(room ? { snapshot: snapshot(room) } : {}) });
            }
        });

        onRequest('room:create', ({ name, characterId }) => {
            if (socket.data.roomCode) fail('ALREADY_JOINED', 'Вы уже находитесь в комнате.');
            const validName = normalizeName(name);
            const validCharacter = validateCharacter(characterId);
            if (rooms.size >= maxRooms) fail('SERVER_FULL', 'Сервер заполнен. Попробуйте позже.');
            const address = socket.handshake.address;
            const limit = creationLimits.get(address) ?? { count: 0, until: Date.now() + 60_000 };
            if (limit.until <= Date.now()) { limit.count = 0; limit.until = Date.now() + 60_000; }
            if (++limit.count > 10) fail('RATE_LIMIT', 'Слишком много новых комнат. Подождите минуту.');
            creationLimits.set(address, limit);
            let code; do { code = roomCode(); } while (rooms.has(code));
            const room = { code, players: [], hostId: null, phase: 'waiting', revision: 0, game: createInitialGameState(), seen: new Map(), updatedAt: Date.now(), rollTimer: null };
            rooms.set(code, room);
            return addPlayer(socket, room, validName, validCharacter);
        });
        onRequest('room:join', ({ code, name, characterId }) => {
            if (socket.data.roomCode) fail('ALREADY_JOINED', 'Вы уже находитесь в комнате.');
            const room = rooms.get(normalizeCode(code));
            if (!room) fail('ROOM_NOT_FOUND', 'Комната не найдена. Проверьте код.');
            const validName = normalizeName(name);
            const validCharacter = validateCharacter(characterId);
            if (room.phase !== 'waiting') fail('ALREADY_STARTED', 'Партия уже началась.');
            if (room.players.length >= MAX_ROOM_PLAYERS) fail('ROOM_FULL', 'Все четыре места заняты.');
            return addPlayer(socket, room, validName, validCharacter);
        });
        onRequest('room:resume', ({ code, token }) => {
            const room = rooms.get(normalizeCode(code));
            if (!room) fail('ROOM_NOT_FOUND', 'Комната больше не существует. Создайте новую.');
            if (typeof token !== 'string' || token.length > 128) fail('BAD_SESSION', 'Не удалось восстановить место игрока.');
            const player = room.players.find(member => member.tokenHash === hashToken(token));
            if (!player) fail('BAD_SESSION', 'Это место больше недоступно. Войдите заново.');
            if (socket.data.roomCode && (socket.data.roomCode !== room.code || socket.data.playerId !== player.id)) fail('ALREADY_JOINED', 'Вы уже находитесь в другой комнате.');
            attach(socket, room, player);
            return { session: { roomCode: room.code, playerId: player.id, token }, snapshot: snapshot(room) };
        });
        onRequest('room:recover', ({ sessions }) => {
            if (!Array.isArray(sessions) || sessions.length > 16) fail('BAD_REQUEST', 'Некорректный список сохранённых сеансов.');
            const available = [];
            for (const saved of sessions) {
                if (!saved || typeof saved.token !== 'string' || saved.token.length > 128) continue;
                const room = rooms.get(normalizeCode(saved.code));
                const player = room?.players.find(member => member.tokenHash === hashToken(saved.token));
                if (player) available.push({ roomCode: room.code, playerId: player.id, name: player.name, characterId: player.characterId, color: player.color,
                    connected: Boolean(player.socketId), phase: room.phase });
            }
            return { sessions: available };
        });
        onRequest('room:start', () => {
            const { room, player } = getMembership(socket);
            if (room.hostId !== player.id) fail('HOST_ONLY', 'Начать партию может создатель комнаты.');
            if (room.phase !== 'waiting') fail('ALREADY_STARTED', 'Партия уже началась.');
            const participants = room.players.filter(member => member.socketId);
            if (participants.length < MIN_ROOM_PLAYERS) fail('WAITING_PLAYERS', 'Для начала партии нужны хотя бы два подключённых игрока.');
            room.players.filter(member => !member.socketId).forEach(member => cancel(member.disconnectTimer));
            room.players = participants;
            room.game = createInitialGameState(participants.map(member => member.color)); room.phase = 'playing'; publish(room);
            return { snapshot: snapshot(room) };
        });
        onRequest('room:restart', () => {
            const { room, player } = getMembership(socket);
            if (room.hostId !== player.id) fail('HOST_ONLY', 'Новую партию начинает создатель комнаты.');
            restart(room); return { snapshot: snapshot(room) };
        });
        onRequest('room:leave', () => {
            const { room, player } = getMembership(socket);
            setNotice(room, player, 'left');
            cancel(player.disconnectTimer);
            if (room.phase === 'playing' && (hasPlayerFinished(room.game, player.color) || isGameOver(room.game))) {
                player.socketId = null; player.disconnectedAt = Date.now();
                socket.leave(room.code); delete socket.data.roomCode; delete socket.data.playerId;
                transferHost(room); publish(room);
                return {};
            }
            room.players = room.players.filter(member => member.id !== player.id);
            socket.leave(room.code); delete socket.data.roomCode; delete socket.data.playerId;
            if (room.players.length === 0) { cancel(room.rollTimer); rooms.delete(room.code); }
            else if (room.phase === 'playing') restart(room);
            else { transferHost(room); publish(room); }
            return {};
        });
        onRequest('game:command', command => {
            const { room, player } = getMembership(socket);
            if (typeof command.id !== 'string' || command.id.length < 8 || command.id.length > 100) fail('BAD_REQUEST', 'У команды отсутствует идентификатор.');
            const key = `${player.id}:${command.id}`;
            if (room.seen.has(key)) return { snapshot: snapshot(room), duplicate: true };
            if (room.phase !== 'playing') fail('NOT_STARTED', 'Партия ещё не началась.');
            if (isGameOver(room.game)) fail('GAME_FINISHED', 'Партия завершена.');
            if (hasPlayerFinished(room.game, player.color)) fail('PLAYER_FINISHED', 'Вы уже победили и наблюдаете за остальными игроками.');
            if (room.players.some(member => !member.socketId && !hasPlayerFinished(room.game, member.color))) fail('PAUSED', 'Ждём подключения продолжающих игроков.');
            const current = room.game.players[room.game.currentPlayerIndex];
            if (current.color !== player.color) fail('NOT_YOUR_TURN', 'Сейчас ход другого игрока.');
            if (command.revision !== room.revision) fail('STALE_STATE', 'Поле обновилось. Повторите действие.');
            let action;
            if (command.type === 'roll') {
                if (!room.game.canRoll || room.game.isRolling) fail('ILLEGAL_ACTION', 'Сейчас нельзя бросать кубики.');
                action = { type: rollDice.type, payload: { id: randomUUID(), values: rollValues(), startedAt: Date.now(), duration: rollDuration(room.game.rollCount + 1) } };
            } else if (command.type === 'place') {
                if (!room.game.canPlace) fail('ILLEGAL_ACTION', 'Для постановки фишки нужна доступная шестёрка.');
                if (command.pieceIndex !== undefined && (!Number.isInteger(command.pieceIndex) || room.game.pieces[player.color][command.pieceIndex]?.tile !== null)) fail('ILLEGAL_ACTION', 'Выберите фишку в руке.');
                action = placePiece(command.pieceIndex);
            } else if (command.type === 'move') {
                const piece = command.pieceIndex === undefined ? room.game.pieces[player.color].find(candidate => candidate.tile === command.tileIndex)
                    : Number.isInteger(command.pieceIndex) ? room.game.pieces[player.color][command.pieceIndex] : null;
                if (!Number.isInteger(command.tileIndex) || !room.game.canMove || !piece || piece.tile !== command.tileIndex || !canPieceMove(room.game, piece, current)) fail('ILLEGAL_ACTION', 'Этой фишкой сейчас ходить нельзя.');
                action = movePiece({ tileIndex: command.tileIndex, pieceIndex: command.pieceIndex });
            } else if (command.type === 'skip') {
                if (!room.game.isRolling || command.rollId !== room.game.diceRoll.id) fail('ILLEGAL_ACTION', 'Этот бросок уже завершён.');
                cancel(room.rollTimer); room.rollTimer = null;
                action = finishDiceRoll(command.rollId);
            } else fail('BAD_COMMAND', 'Неизвестное игровое действие.');
            room.game = gameReducer(room.game, action);
            room.seen.set(key, true);
            if (room.seen.size > 256) room.seen.delete(room.seen.keys().next().value);
            publish(room);
            if (command.type === 'roll') {
                const roll = room.game.diceRoll;
                room.rollTimer = schedule(() => { if (rooms.get(room.code) === room && room.game.isRolling && room.game.diceRoll.id === roll.id) finishRoll(room, roll.id); }, roll.duration);
            }
            return { snapshot: snapshot(room) };
        });

        socket.on('disconnect', () => {
            const room = rooms.get(socket.data.roomCode);
            const player = room?.players.find(member => member.id === socket.data.playerId && member.socketId === socket.id);
            if (!player) return;
            player.socketId = null; player.disconnectedAt = Date.now();
            setNotice(room, player, 'disconnected'); transferHost(room); publish(room);
            if (room.phase === 'waiting') player.disconnectTimer = schedule(() => {
                if (rooms.get(room.code) !== room || player.socketId || room.phase !== 'waiting') return;
                room.players = room.players.filter(member => member !== player);
                if (room.players.length === 0) rooms.delete(room.code);
                else { transferHost(room); publish(room); }
            }, lobbyGrace);
        });
    });

    const cleanup = setInterval(() => {
        for (const room of rooms.values()) if (room.players.every(player => !player.socketId) && Date.now() - room.updatedAt > roomTtl) {
            cancel(room.rollTimer); room.players.forEach(player => cancel(player.disconnectTimer)); rooms.delete(room.code);
        }
        for (const [address, limit] of creationLimits) if (limit.until < Date.now()) creationLimits.delete(address);
    }, Math.min(60_000, roomTtl));
    cleanup.unref();
    return { rooms, close() { clearInterval(cleanup); timers.forEach(clearTimeout); timers.clear(); } };
};
