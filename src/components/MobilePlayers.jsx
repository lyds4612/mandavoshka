import { PLAYER_THEMES, playerStyle } from './gamePresentation';

const MobilePlayers = ({ players, pieces, currentPlayerColor, participants = [], phase, zoomed, onZoom, zoomDisabled }) => (
    <div className="mobile-table-head">
        <div className="mobile-players" role="list" aria-label="Игроки и прогресс" style={{ '--mobile-player-count': players.length }}>
            {players.map(player => {
                const member = participants.find(participant => participant.color === player.color);
                const name = member?.name ?? PLAYER_THEMES[player.color].name;
                const connected = member?.connected !== false;
                const active = connected && phase === 'playing' && player.color === currentPlayerColor;
                const finished = pieces[player.color].filter(piece => piece.tile === player.home[3]).length;
                return <div key={player.color} role="listitem" className={`mobile-player ${active ? 'is-active' : ''} ${!connected ? 'is-disconnected' : ''}`}
                    style={playerStyle(player.color)} aria-label={`${name}, ${connected ? `в хате ${finished} из 4` : 'отключился, место сохранено'}${active ? ', текущий ход' : ''}`} title={name}>
                    <span className="mobile-player-name">{name}</span>
                    {connected ? <span className="mobile-player-progress"><span aria-hidden="true">{PLAYER_THEMES[player.color].suit}</span><strong>{finished}<span> / 4</span></strong></span>
                        : <span className="mobile-player-offline">Отключился</span>}
                </div>;
            })}
        </div>
        <button type="button" className="board-zoom-toggle" onClick={onZoom} disabled={zoomDisabled} aria-pressed={zoomed}
            aria-label={zoomed ? 'Показать поле целиком' : 'Увеличить поле'} title={zoomed ? 'Показать поле целиком' : 'Увеличить клетки; поле можно двигать пальцем'}>
            <span aria-hidden="true">{zoomed ? '−' : '+'}</span><span>{zoomed ? 'Целиком' : 'Крупнее'}</span>
        </button>
    </div>
);

export default MobilePlayers;
