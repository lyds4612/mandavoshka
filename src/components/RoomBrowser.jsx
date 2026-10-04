import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectMultiplayer } from '../store/multiplayerSlice';
import { getCharacter } from '../shared/characters';
import { playerStyle } from './gamePresentation';
import CharacterPortrait from './CharacterPortrait';
import './RoomBrowser.css';

const RoomBrowser = ({ name, characterId }) => {
    const dispatch = useDispatch();
    const { rooms, roomsStatus, roomsError, pending } = useSelector(selectMultiplayer);
    const canJoin = Boolean(name.trim() && characterId);
    useEffect(() => {
        dispatch({ type: 'online/watchRooms' });
        return () => { dispatch({ type: 'online/unwatchRooms' }); };
    }, [dispatch]);

    return <section className="room-browser" aria-label="Комнаты в сети" aria-busy={roomsStatus === 'loading'}>
        <div className="room-browser-heading"><div><h3>Комнаты в сети{roomsStatus === 'ready' && <span>{rooms.length}</span>}</h3><p>Присоединитесь к столу, где ещё ждут игроков.</p></div>
            <button type="button" className="button button-quiet refresh-rooms" disabled={roomsStatus === 'loading' || pending}
                onClick={() => dispatch({ type: 'online/refreshRooms' })}><span aria-hidden="true">↻</span> Обновить</button></div>
        {roomsStatus === 'loading' && <p className="room-browser-message" role="status">Обновляем список комнат…</p>}
        {roomsStatus === 'error' && <p className="room-browser-message is-error" role="status">{roomsError}</p>}
        {roomsStatus === 'ready' && rooms.length === 0 && <p className="room-browser-empty" role="status">Пока нет открытых комнат. Создайте свою и ждите соперников.</p>}
        {rooms.length > 0 && <ul className="room-browser-list">{rooms.map(room => {
            const host = getCharacter(room.host.characterId);
            const bots = room.players.filter(player => player.isBot).length;
            return <li key={room.code} className="room-browser-room" data-room-code={room.code} data-free-seats={room.freeSeats}>
                <div className="room-browser-identity">{host && <CharacterPortrait character={host} className="room-browser-host" />}
                    <div><strong title={room.host.name}>Стол {room.host.name}</strong><span>Комната {room.code}{bots > 0 && ` · ботов: ${bots}`}</span></div>
                    <span className="room-browser-count" data-full={room.freeSeats === 0} aria-label={`${room.players.length} из ${room.capacity} мест занято`}>{room.players.length}<span> / {room.capacity}</span></span></div>
                <div className="room-browser-footer"><div className="room-browser-roster" aria-label="Участники за столом">{room.players.map((player, index) => {
                    const character = getCharacter(player.characterId);
                    return character && <span key={index} className={`room-browser-player ${player.connected ? '' : 'is-disconnected'}`}
                        style={playerStyle('green', character.id)} title={`${player.name}${player.isBot ? ' · бот' : player.connected ? '' : ' · место сохранено'}`}>
                        <CharacterPortrait character={character} /><span className="sr-only">{player.name}{player.isBot ? ', бот' : !player.connected ? ', место сохранено' : ''}</span></span>;
                })}{Array.from({ length: room.freeSeats }, (_, index) => <span className="room-browser-free" key={`free-${index}`} title="Свободное место" aria-hidden="true">+</span>)}</div>
                    <button type="button" className="button button-secondary join-listed-room" aria-label={`Войти в комнату ${room.code}, хозяин ${room.host.name}`}
                        disabled={!canJoin || pending || roomsStatus !== 'ready' || room.freeSeats === 0}
                        onClick={() => dispatch({ type: 'online/join', payload: { code: room.code, name, characterId } })}>{room.freeSeats === 0 ? 'Мест нет' : 'Войти'}{room.freeSeats > 0 && <span aria-hidden="true"> →</span>}</button></div>
            </li>;
        })}</ul>}
        {!canJoin && rooms.length > 0 && <p className="room-browser-hint">Выберите персонажа и введите ник выше, чтобы войти.</p>}
    </section>;
};

export default RoomBrowser;
