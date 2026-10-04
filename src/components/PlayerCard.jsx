import { Fleur } from './Ornaments';
import { PLAYER_THEMES, playerStyle, summarizePieces } from './gamePresentation';
import PieceReserve from './pieces/PieceReserve';
import { getCharacter } from '../shared/characters';
import CharacterPortrait from './CharacterPortrait';
import { countOccupiedHomeCells } from '../store/logic/gameRules';
import PieceActions from './pieces/PieceActions';

const PlayerCard = ({ player, pieces, currentPlayerColor, tiles, prisonTileIndex, won, lost, gameOver, interaction, isMyTurn, isRolling, canRoll,
    displayName, characterId, connected = true, phase = 'playing', paused = false, isMe = false, isBot = false }) => {
    const theme = PLAYER_THEMES[player.color];
    const active = connected && phase === 'playing' && !paused && !gameOver && !won && player.color === currentPlayerColor;
    const name = displayName ?? theme.name;
    const character = getCharacter(characterId);
    const summary = summarizePieces(pieces, tiles, prisonTileIndex);
    const finished = countOccupiedHomeCells(pieces, player.home);
    const showPieceActions = active && isMyTurn && Object.keys(interaction.available).length > 0;
    const hint = active && isMyTurn && connected
        ? isRolling ? 'Кубики летят…' : Object.keys(interaction.available).length > 0 ? interaction.hint
            : canRoll ? 'Нажмите на поле для броска' : ''
        : active && isBot ? isRolling ? 'Бросает кубики…' : 'Выбирает ход…' : '';
    return (
        <section className={`player-card player-card-${theme.position} ${active ? 'is-active' : ''} ${!connected ? 'is-disconnected' : ''}`} style={playerStyle(player.color)} aria-label={`${name}, ${character ? `${character.name}, ` : ''}${theme.suitName}${active ? ', текущий ход' : ''}`} data-player-color={player.color} data-character-id={character?.id}>
            <span className="prison-card-tag" aria-hidden="true">ДЕЛО № 00{theme.name.slice(-1)}</span>
            {active && <span className="player-current-turn-badge" aria-hidden="true"><span>▶</span> Сейчас ходит</span>}
            <Fleur className="player-crest" />
            <div className="player-card-heading"><span className="player-suit" aria-hidden="true">{theme.suit}</span><h2 title={name}>{name}</h2>{(isMe || isBot) && <span className="player-you">{isBot ? 'Бот' : 'Вы'}</span>}</div>
            <span className="player-suit-name" title={character?.name}>{character?.title ?? theme.suitName}</span>
            {!connected && <span className="player-connection-state">Отключился</span>}
            <div className="player-avatar" aria-hidden="true" title={character?.name}>
                {character ? <CharacterPortrait character={character} loading="eager" />
                    : <svg viewBox="0 0 100 100"><path d="M50 13C31 13 27 30 31 45C28 47 30 57 34 57C35 65 40 69 40 73L24 81C18 85 16 92 16 100H84C84 92 82 85 76 81L60 73C60 69 65 65 66 57C70 57 72 47 69 45C73 30 69 13 50 13Z" fill="currentColor" /></svg>}
            </div>
            <PieceReserve color={player.color} pieces={pieces} tiles={tiles} prisonTileIndex={prisonTileIndex} interaction={interaction} />
            <div className="player-stats"><span>В хате</span><strong>{finished}<span> / 4</span></strong></div>
            <div className="player-details">На поле {summary.field}{summary.jail > 0 && ` · СИЗО ${summary.jail}`}{summary.prison > 0 && ` · Тюрьма ${summary.prison}`}</div>
            <div className={`player-turn-details ${showPieceActions ? 'has-piece-actions' : ''}`} aria-hidden={hint || showPieceActions ? undefined : true}>
                <p className="player-play-hint" role={hint ? 'status' : undefined} title={hint || undefined}>{hint}</p>
                {showPieceActions && <PieceActions interaction={interaction} />}
            </div>
            <div className={`player-turn-state ${active ? 'is-current-turn' : ''} ${active && isMyTurn ? 'is-your-turn' : ''} ${won ? 'is-winner' : ''} ${lost ? 'is-loser' : ''}`}>
                {won ? 'Победитель' : lost ? 'Не успел' : !connected ? 'Ждём возвращения' : phase === 'waiting' ? 'Готов к партии'
                    : paused ? 'Партия на паузе' : active ? isMyTurn ? 'Ваш ход' : 'Ходит сейчас' : 'Ждёт своего хода'}
            </div>
        </section>
    );
};

export default PlayerCard;
