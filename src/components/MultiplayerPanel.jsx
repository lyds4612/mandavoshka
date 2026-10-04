import { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectMultiplayer } from '../store/multiplayerSlice.js';
import { PLAYER_COLORS } from '../store/gameBoardInit.js';
import { MIN_ROOM_PLAYERS, MAX_ROOM_PLAYERS } from '../shared/multiplayerConfig.js';
import { getInvitationCode } from '../multiplayer/invitation.js';
import { PLAYER_THEMES, playerStyle } from './gamePresentation';
import { getCharacter } from '../shared/characters';
import CharacterPicker from './CharacterPicker';
import CharacterPortrait from './CharacterPortrait';
import BotCountPicker from './BotCountPicker';
import './MultiplayerPanel.css';

const MultiplayerPanel = ({ characterId, onCharacterChange, name, onNameChange, onBack }) => {
    const dispatch = useDispatch();
    const network = useSelector(selectMultiplayer);
    const [inviteCode] = useState(getInvitationCode);
    const [code, setCode] = useState('');
    const [botCount, setBotCount] = useState(0);
    const invited = Boolean(inviteCode);
    const validInvite = /^[A-Z2-9]{6}$/.test(inviteCode);
    const [copyMessage, setCopyMessage] = useState('');
    const inviteInput = useRef(null);
    const room = network.room;
    const online = network.mode === 'online';
    const restoring = !online && network.recoveryStatus !== 'ready';
    const connected = network.status === 'connected' && !network.sessionExpired && !network.sessionReplaced;
    const isConnected = player => player.connected && (player.id !== network.playerId || connected);
    const me = room?.players.find(player => player.id === network.playerId);
    const isHost = room?.hostId === network.playerId;
    const connectedCount = room?.players.filter(isConnected).length ?? 0;
    const roomBotCount = room?.players.filter(player => player.isBot).length ?? 0;
    const maxBots = MAX_ROOM_PLAYERS - (room?.players.filter(player => !player.isBot).length ?? 1);
    const ready = connected && !network.pending && connectedCount >= MIN_ROOM_PLAYERS;
    const seatColors = room?.phase === 'playing'
        ? PLAYER_COLORS.filter(color => room.players.some(player => player.color === color)) : PLAYER_COLORS;
    const waitingMessage = isHost
        ? connectedCount < MIN_ROOM_PLAYERS ? 'Пригласите друга или добавьте бота, чтобы начать партию.'
            : room?.players.length === MAX_ROOM_PLAYERS && roomBotCount > 0 ? 'Все места заняты. Чтобы пригласить друга, уменьшите число ботов или начните партию этим составом.'
            : `Можно начать: ${connectedCount} участника. За столом до ${MAX_ROOM_PLAYERS} мест для друзей и ботов.`
        : 'Ждём начала партии хозяином комнаты. Для старта достаточно двух участников, включая ботов.';
    const statusMessage = network.status === 'error' ? 'Не удалось восстановить сеанс. Выйдите и войдите в комнату заново.'
        : !connected ? 'Связь потеряна. Переподключаемся…'
        : room?.phase === 'waiting' ? waitingMessage
        : room?.players.some(player => player.result === 'loser') ? 'Партия завершена. Победители и тот, кто не успел, показаны на поле.'
        : room?.paused ? 'Партия приостановлена: ждём отключившихся игроков.'
        : me?.result === 'winner' ? 'Вы победили. Можно наблюдать, пока остальные доигрывают.' : 'Ходы и броски синхронизируются у всех игроков.';
    const nicknameField = <label className="online-nickname">Ваш ник<input className="online-name" autoComplete="nickname" maxLength={24}
        value={name} onChange={event => onNameChange(event.target.value)} placeholder="Как вас зовут?" required disabled={network.pending} /></label>;
    const invite = new URL(window.location.href);
    if (network.inviteOrigin) {
        const origin = new URL(network.inviteOrigin);
        invite.protocol = origin.protocol;
        invite.host = origin.host;
    }
    if (room) invite.searchParams.set('room', room.code);
    const copyInvite = async () => {
        try { await navigator.clipboard.writeText(invite.href); setCopyMessage('Ссылка скопирована'); }
        catch {
            inviteInput.current?.focus();
            inviteInput.current?.select();
            let copied = false;
            try { copied = document.execCommand('copy'); } catch { /* The selected link can still be copied manually. */ }
            setCopyMessage(copied ? 'Ссылка скопирована' : 'Ссылка выделена — скопируйте её');
        }
    };
    return (
        <section id="online-panel" className={`multiplayer-panel ${!online && invited ? 'is-invitation' : ''} ${restoring ? 'is-restoring' : ''}`} aria-label="Онлайн-игра" data-online-mode={network.mode}>
            {restoring ? <div className="online-restoring" role="status">
                <strong>{network.recoveryStatus === 'error' ? 'Ждём соединения с сервером' : 'Возвращаемся в игру…'}</strong>
                <p>Сохранённый вход восстановится автоматически.</p>
                {network.recoveryStatus === 'error' && <button type="button" className="button button-secondary retry-recovery"
                    onClick={() => dispatch({ type: 'online/recover' })}>Подключиться сейчас</button>}
            </div> : !online && invited ? (
                <div className="online-invitation">
                    <span className="online-invitation-suit" aria-hidden="true">♣</span>
                    <div className="online-invitation-copy"><span className="eyebrow">Приглашение в комнату {inviteCode}</span>
                        <h2>Ваше место за столом</h2><p>Выберите персонажа и введите ник — и сразу попадёте к друзьям.</p>
                        <button type="button" className="button button-quiet back-game-menu" onClick={onBack}>← В меню</button></div>
                    <form className="online-form online-invite-form" onSubmit={event => {
                        event.preventDefault(); dispatch({ type: 'online/join', payload: { code: inviteCode, name, characterId } });
                    }}>
                        <CharacterPicker value={characterId} onChange={onCharacterChange} disabled={network.pending} />
                        {nicknameField}
                        <button type="submit" className="button button-primary join-room" disabled={!name.trim() || !characterId || !validInvite || network.pending}>
                            {network.pending ? 'Входим…' : 'Войти в комнату'} <span aria-hidden="true">→</span>
                        </button>
                    </form>
                    {!validInvite && <p className="online-error" role="alert">Ссылка приглашения повреждена. Попросите хозяина скопировать её заново.</p>}
                </div>
            ) : !online ? (
                <div className="online-setup">
                    <div className="game-setup-heading"><div><span className="eyebrow">Онлайн · 2–4 игрока</span><h2>Соберите друзей за столом</h2></div>
                        <button type="button" className="button button-quiet back-game-menu" onClick={onBack}>← В меню</button></div>
                    <form className="online-form" onSubmit={event => { event.preventDefault(); dispatch({ type: 'online/join', payload: { code, name, characterId } }); }}>
                        <CharacterPicker value={characterId} onChange={onCharacterChange} disabled={network.pending} />
                        {nicknameField}
                        <div className="online-create-options"><BotCountPicker context="create" value={botCount} onChange={setBotCount} disabled={network.pending} hint="Остальные места останутся свободными для друзей." />
                        <button type="button" className="button button-secondary create-room" disabled={!name.trim() || !characterId || network.pending} onClick={() => dispatch({ type: 'online/create', payload: { name, characterId, botCount } })}>{network.pending ? 'Подключаем…' : 'Создать комнату'}</button></div>
                        <label>Код комнаты<input className="online-code" autoComplete="off" maxLength={6} value={code} onChange={event => setCode(event.target.value.toUpperCase().replace(/[^A-Z2-9]/g, ''))} placeholder="ABC123" disabled={network.pending} /></label>
                        <button type="submit" className="button button-secondary join-room" disabled={!name.trim() || !characterId || code.length !== 6 || network.pending}>Войти по коду</button>
                    </form>
                </div>
            ) : (
                <>
                    <div className="online-room-heading">
                        <div><span className="online-connection-dot" data-connected={connected} /><strong>{room ? `Комната ${room.code}` : 'Восстанавливаем подключение…'}</strong>
                            {room && <span className="online-count" data-ready={connectedCount >= MIN_ROOM_PLAYERS} title="Для начала партии нужны минимум два участника, включая ботов">{connectedCount}/{room.phase === 'playing' ? room.players.length : MAX_ROOM_PLAYERS} за столом{roomBotCount > 0 && ` · ботов: ${roomBotCount}`}</span>}
                            {me && <span className="online-identity">Вы: {me.name} · {getCharacter(me.characterId)?.title}</span>}
                        </div>
                        <button type="button" className="button button-quiet leave-room" disabled={network.pending} onClick={() => dispatch({ type: 'online/leave' })}>Выйти</button>
                    </div>
                    {room && <>
                        <ul className="online-players" data-seat-count={seatColors.length} style={{ '--online-seat-count': seatColors.length }}>
                            {seatColors.map(color => {
                                const player = room.players.find(member => member.color === color);
                                const character = getCharacter(player?.characterId);
                                return <li key={color} style={playerStyle(color, character?.id)} data-character-id={character?.id} data-is-bot={Boolean(player?.isBot)} className={`${player?.id === network.playerId ? 'is-me' : ''} ${!player ? 'is-empty' : !isConnected(player) ? 'is-disconnected' : ''}`}>
                                    {character && <CharacterPortrait character={character} className="online-player-portrait" />}
                                    <div className="online-player-copy"><span className="online-player-name"><span className="online-player-suit" style={{ color: 'var(--player-light)' }} aria-hidden="true">{PLAYER_THEMES[color].suit}</span> {player?.name ?? 'Свободное место'}{player?.id === room.hostId ? ' · хозяин' : ''}</span>
                                    {character && <span className="online-player-character" title={character.name}>{character.title}</span>}
                                    <span className="online-seat-status">{player ? `${player.result === 'winner' ? 'победитель · ' : player.result === 'loser' ? 'не успел · ' : ''}${player.isBot ? 'бот · ходит сам' : isConnected(player) ? 'в сети' : 'отключился · место сохранено'}` : connectedCount < MIN_ROOM_PLAYERS ? 'пригласите друга или добавьте бота' : 'можно пригласить ещё'}</span>
                                    </div>
                                </li>;
                            })}
                        </ul>
                        {room.phase === 'waiting' && isHost && <BotCountPicker context="room" value={roomBotCount} max={maxBots} disabled={!connected || network.pending}
                            onChange={count => dispatch({ type: 'online/setBots', payload: { count } })} hint="Можно менять до начала партии. Уберите бота, чтобы освободить место другу." />}
                        <div className="online-room-actions">
                            {room.phase === 'waiting' && <>
                                <input ref={inviteInput} readOnly className="online-invite" aria-label="Ссылка для приглашения друзей" value={invite.href} onFocus={event => event.target.select()} />
                                <button type="button" className="button button-quiet copy-invite" onClick={copyInvite}>Копировать ссылку</button>
                                {isHost && <button type="button" className="button button-primary start-online-game" disabled={!ready} onClick={() => dispatch({ type: 'online/start' })}>Начать партию · {connectedCount} {connectedCount === 1 ? 'игрок' : 'игрока'}</button>}
                            </>}
                            <p className="online-status" role="status">{statusMessage}{copyMessage && ` ${copyMessage}.`}</p>
                        </div>
                    </>}
                </>
            )}
            {network.error && <p className="online-error" role="alert">{network.error}</p>}
        </section>
    );
};

export default MultiplayerPanel;
