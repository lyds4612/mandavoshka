import { PLAYER_THEMES, playerStyle } from './gamePresentation';
import { getCharacter } from '../shared/characters';
import CharacterPortrait from './CharacterPortrait';
import { PieceActionButton } from './pieces/PieceActions';

const MobilePlayers = ({ players, pieces, currentPlayerColor, participants = [], phase, zoomed, onZoom, zoomDisabled, interaction }) => (
    <div className="mobile-table-head">
        <div className="mobile-players" role="list" aria-label="Игроки и прогресс" style={{ '--mobile-player-count': players.length }}>
            {players.map(player => {
                const member = participants.find(participant => participant.color === player.color);
                const name = member?.name ?? PLAYER_THEMES[player.color].name;
                const character = getCharacter(member?.characterId);
                const connected = member?.connected !== false;
                const active = connected && phase === 'playing' && player.color === currentPlayerColor;
                const finished = pieces[player.color].filter(piece => piece.tile === player.home[3]).length;
                return <div key={player.color} role="listitem" className={`mobile-player ${active ? 'is-active' : ''} ${!connected ? 'is-disconnected' : ''}`}
                    style={playerStyle(player.color)} data-character-id={character?.id} aria-label={`${name}, ${character ? `${character.name}, ` : ''}${connected ? `в хате ${finished} из 4` : 'отключился, место сохранено'}${active ? ', текущий ход' : ''}`} title={character ? `${name} · ${character.title}` : name}>
                    <span className="mobile-player-identity">{character && <CharacterPortrait character={character} className="mobile-player-portrait" loading="eager" />}<span className="mobile-player-name">{name}</span></span>
                    {connected ? <span className="mobile-player-progress"><span aria-hidden="true">{PLAYER_THEMES[player.color].suit}</span><strong>{finished}<span> / 4</span></strong></span>
                        : <span className="mobile-player-offline">Отключился</span>}
                </div>;
            })}
        </div>
        <PieceActionButton interaction={interaction} />
        {interaction.selectedId ? <button type="button" className="board-zoom-toggle cancel-piece-selection" onClick={interaction.clearSelection}
            disabled={Boolean(interaction.drag)} aria-label="Отменить выбор"><span aria-hidden="true">×</span><span>Отмена</span></button>
        : <button type="button" className="board-zoom-toggle" onClick={onZoom} disabled={zoomDisabled} aria-pressed={zoomed}
            aria-label={zoomed ? 'Показать поле целиком' : 'Увеличить поле'} title={zoomed ? 'Показать поле целиком' : 'Увеличить клетки; поле можно двигать пальцем'}>
            <span aria-hidden="true">{zoomed ? '−' : '+'}</span><span>{zoomed ? 'Целиком' : 'Крупнее'}</span>
        </button>}
    </div>
);

export default MobilePlayers;
