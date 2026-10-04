import { PLAYER_THEMES, playerStyle } from './gamePresentation';
import { getCharacter } from '../shared/characters';
import CharacterPortrait from './CharacterPortrait';
import { PieceActionButton } from './pieces/PieceActions';
import { countOccupiedHomeCells } from '../store/logic/gameRules';

const MobilePlayers = ({ players, pieces, currentPlayerColor, participants = [], phase, paused, winners, loser, zoomed, onZoom, zoomDisabled, interaction }) => (
    <div className="mobile-table-head">
        <div className="mobile-players" role="list" aria-label="Игроки и прогресс" style={{ '--mobile-player-count': players.length }}>
            {players.map(player => {
                const member = participants.find(participant => participant.color === player.color);
                const name = member?.name ?? PLAYER_THEMES[player.color].name;
                const character = getCharacter(member?.characterId);
                const connected = member?.connected !== false;
                const won = winners.includes(player.color);
                const lost = loser === player.color;
                const active = connected && phase === 'playing' && !paused && !loser && !won && player.color === currentPlayerColor;
                const finished = countOccupiedHomeCells(pieces[player.color], player.home);
                return <div key={player.color} role="listitem" className={`mobile-player ${active ? 'is-active' : ''} ${!connected && !won && !lost ? 'is-disconnected' : ''} ${won ? 'is-winner' : ''} ${lost ? 'is-loser' : ''}`}
                    style={playerStyle(player.color)} data-player-color={player.color} data-character-id={character?.id} data-is-bot={Boolean(member?.isBot)} aria-label={`${name}, ${member?.isBot ? 'бот, ' : ''}${character ? `${character.name}, ` : ''}${won ? 'победитель' : lost ? 'не успел' : connected ? `в хате ${finished} из 4` : 'отключился, место сохранено'}${active ? ', текущий ход' : ''}`} title={`${character ? `${name} · ${character.title}` : name}${member?.isBot ? ' · бот' : ''}`}>
                    <span className="mobile-player-identity">{character && <CharacterPortrait character={character} className="mobile-player-portrait" loading="eager" />}<span className="mobile-player-name">{name}</span></span>
                    {connected || won || lost ? <span className="mobile-player-progress"><span aria-hidden="true">{PLAYER_THEMES[player.color].suit}</span><strong>{finished}<span> / 4</span></strong></span>
                        : <span className="mobile-player-offline">Отключился</span>}
                    <span className={`mobile-player-turn ${active || won || lost ? 'is-visible' : ''}`} aria-hidden="true">{won ? '✓' : lost ? '✕' : 'ХОД'}</span>
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
