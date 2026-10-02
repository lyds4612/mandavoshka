import { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectMultiplayer } from '../store/multiplayerSlice.js';
import { PLAYER_COLORS } from '../store/gameBoardInit.js';
import { MIN_ROOM_PLAYERS, MAX_ROOM_PLAYERS } from '../shared/multiplayerConfig.js';
import { getInvitationCode } from '../multiplayer/invitation.js';
import { PLAYER_THEMES } from './gamePresentation';
import './MultiplayerPanel.css';

const MultiplayerPanel = ({ expanded = false }) => {
    const dispatch = useDispatch();
    const network = useSelector(selectMultiplayer);
    const [name, setName] = useState('');
    const [inviteCode] = useState(getInvitationCode);
    const [code, setCode] = useState('');
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
    const ready = connected && !network.pending && connectedCount >= MIN_ROOM_PLAYERS;
    const seatColors = room?.phase === 'playing'
        ? PLAYER_COLORS.filter(color => room.players.some(player => player.color === color)) : PLAYER_COLORS;
    const waitingMessage = isHost
        ? connectedCount < MIN_ROOM_PLAYERS ? 'Пригласите ещё одного игрока. Можно играть вдвоём, втроём или вчетвером.'
            : `Можно начать: ${connectedCount} игрока. Или пригласите ещё друзей — до ${MAX_ROOM_PLAYERS} участников.`
        : 'Ждём начала партии хозяином комнаты. Для старта достаточно двух игроков.';
    const statusMessage = network.status === 'error' ? 'Не удалось восстановить сеанс. Выйдите и войдите в комнату заново.'
        : !connected ? 'Связь потеряна. Переподключаемся…'
        : room?.phase === 'waiting' ? waitingMessage
        : room?.paused ? 'Партия приостановлена: ждём отключившихся игроков.' : 'Ходы и броски синхронизируются у всех игроков.';
    const nicknameField = <label>Ваш ник<input className="online-name" autoComplete="nickname" maxLength={24}
        autoFocus={invited} value={name} onChange={event => setName(event.target.value)} placeholder="Как вас зовут?" required disabled={network.pending} /></label>;
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
                        <h2>Ваше место за столом</h2><p>Введите ник — и сразу попадёте к друзьям.</p></div>
                    <form className="online-form online-invite-form" onSubmit={event => {
                        event.preventDefault(); dispatch({ type: 'online/join', payload: { code: inviteCode, name } });
                    }}>
                        {nicknameField}
                        <button type="submit" className="button button-primary join-room" disabled={!name.trim() || !validInvite || network.pending}>
                            {network.pending ? 'Входим…' : 'Войти в комнату'} <span aria-hidden="true">→</span>
                        </button>
                    </form>
                    {!validInvite && <p className="online-error" role="alert">Ссылка приглашения повреждена. Попросите хозяина скопировать её заново.</p>}
                </div>
            ) : !online ? (
                <details className="online-setup" open={expanded || code.length > 0 || Boolean(network.error)}>
                    <summary><span aria-hidden="true">♧</span> Играть онлайн <span className="online-caption">От 2 до 4 игроков</span></summary>
                    <form className="online-form" onSubmit={event => { event.preventDefault(); dispatch({ type: 'online/join', payload: { code, name } }); }}>
                        {nicknameField}
                        <button type="button" className="button button-secondary create-room" disabled={!name.trim() || network.pending} onClick={() => dispatch({ type: 'online/create', payload: { name } })}>{network.pending ? 'Подключаем…' : 'Создать комнату'}</button>
                        <label>Код комнаты<input className="online-code" autoComplete="off" maxLength={6} value={code} onChange={event => setCode(event.target.value.toUpperCase().replace(/[^A-Z2-9]/g, ''))} placeholder="ABC123" disabled={network.pending} /></label>
                        <button type="submit" className="button button-secondary join-room" disabled={!name.trim() || code.length !== 6 || network.pending}>Войти по коду</button>
                    </form>
                </details>
            ) : (
                <>
                    <div className="online-room-heading">
                        <div><span className="online-connection-dot" data-connected={connected} /><strong>{room ? `Комната ${room.code}` : 'Восстанавливаем подключение…'}</strong>
                            {room && <span className="online-count" data-ready={connectedCount >= MIN_ROOM_PLAYERS} title="Для начала партии нужны минимум два игрока">{connectedCount}/{room.phase === 'playing' ? room.players.length : MAX_ROOM_PLAYERS} в сети</span>}
                            {me && <span className="online-identity">Вы: {me.name} · {PLAYER_THEMES[me.color].suitName}</span>}
                        </div>
                        <button type="button" className="button button-quiet leave-room" disabled={network.pending} onClick={() => dispatch({ type: 'online/leave' })}>Выйти</button>
                    </div>
                    {room && <>
                        <ul className="online-players" data-seat-count={seatColors.length} style={{ '--online-seat-count': seatColors.length }}>
                            {seatColors.map(color => {
                                const player = room.players.find(member => member.color === color);
                                return <li key={color} className={`${player?.id === network.playerId ? 'is-me' : ''} ${!player ? 'is-empty' : !isConnected(player) ? 'is-disconnected' : ''}`}><span className="online-player-suit" style={{ color: PLAYER_THEMES[color].light }} aria-hidden="true">{PLAYER_THEMES[color].suit}</span>
                                    <span>{player?.name ?? 'Свободное место'}{player?.id === room.hostId ? ' · хозяин' : ''}</span>
                                    <span className="online-seat-status">{player ? isConnected(player) ? 'в сети' : 'отключился · место сохранено' : connectedCount < MIN_ROOM_PLAYERS ? 'пригласите друга' : 'можно пригласить ещё'}</span>
                                </li>;
                            })}
                        </ul>
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
