import { useSelector } from 'react-redux';
import './GameBoard.css';
import AlleyArrows from './AlleyArrows';
import BoardArtwork from './BoardArtwork';
import Dice from './Dice';
import { CornerOrnament, DiceIcon, Fleur } from './Ornaments';
import { PLAYER_THEMES, playerStyle } from './gamePresentation';
import { SIDE_SIZE } from '../store/gameBoardInit';
import { pieceId } from './pieces/usePieceInteraction';
import { selectPieces, selectPlayers, selectTileIndexes, selectTiles } from '../store/selectors/gameSelectors';

const ROMAN_NUMERALS = ['I', 'II', 'III'];
const tileLabel = (tile, [x, y]) => {
    if (tile.name === 'jail') return ROMAN_NUMERALS[tile.needToRoll - 1];
    if (tile.name === 'home') return tile.position + 1;
    return Math.abs((x === 0 || x === SIDE_SIZE ? y : x) - SIDE_SIZE / 2);
};
const tileDescription = (tile, label, startingPlayer) => {
    if (tile.name === 'prison') return 'Центральная тюрьма';
    if (tile.name === 'jail') return `СИЗО, камера ${label}. Для выхода нужно ${tile.needToRoll}`;
    if (tile.name === 'home') return `${PLAYER_THEMES[tile.owner].suitName}, хата ${label}`;
    if (tile.name === 'alley') return 'Подворотня, клетка 2. Остановка переносит на другую сторону угла';
    if (tile.name === 'jail-enter') return 'Клетка 3, вход в СИЗО';
    if (startingPlayer) return `${PLAYER_THEMES[startingPlayer.color].name}, старт 0`;
    return `Клетка ${label}`;
};
const TilePieces = ({ pieces, interaction }) => (
    <span className="tile-pieces" data-piece-count={pieces.length} style={{ '--piece-columns': Math.ceil(Math.sqrt(pieces.length)) }}>
        {pieces.map((piece) => (
            <span key={piece.id} className={`piece ${interaction.available[piece.id] ? 'is-draggable' : ''} ${interaction.selectedId === piece.id ? 'is-selected' : ''} ${interaction.drag?.id === piece.id ? 'is-drag-source' : ''}`}
                data-piece-id={piece.id} data-piece-color={piece.color} data-piece-progress={piece.progress ?? ''} style={playerStyle(piece.color)} />
        ))}
    </span>
);

const GameBoard = ({ onTileClick, selectedTileIndex, movableTileIndexes, interaction, visualTheme = 'classic', canRoll, onRoll, isRolling, canSkip, onSkip, connectionPause, onReconnect, results }) => {
    const tileIndexes = useSelector(selectTileIndexes);
    const players = useSelector(selectPlayers);
    const pieces = useSelector(selectPieces);
    const tiles = useSelector(selectTiles);
    const activeColors = players.map(player => player.color);
    const piecesByTile = {};
    Object.entries(pieces).forEach(([color, playerPieces]) => playerPieces.forEach((piece, index) => {
        if (piece.tile !== null) (piecesByTile[piece.tile] ??= []).push({ ...piece, id: pieceId(color, index) });
    }));
    return (
        <div className="board-frame">
            {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((corner) => <CornerOrnament key={corner} className={corner} />)}
            <Fleur className="board-crest-top" /><Fleur className="board-crest-bottom" />
            <div id="game-board" aria-label="Игровое поле Мандавошки" data-can-roll={String(canRoll)}>
                <BoardArtwork theme={visualTheme} activeColors={activeColors} />
                <AlleyArrows tiles={tiles} tileIndexes={tileIndexes} />
                <div className="board-grid">
                    {tiles.map((tile) => {
                        const [x, y] = tileIndexes.index[tile.index];
                        const tilePieces = piecesByTile[tile.index] ?? [];
                        const isPrison = tile.name === 'prison';
                        const label = isPrison ? '' : tileLabel(tile, [x, y]);
                        const isMovable = movableTileIndexes.includes(tile.index);
                        const isSelected = isMovable && tile.index === selectedTileIndex;
                        const isTarget = interaction.targetTiles.includes(tile.index);
                        const isHovered = interaction.drag?.target === String(tile.index);
                        const startingPlayer = players.find((player) => player.start === tile.index);
                        const inactiveHome = tile.name === 'home' && !activeColors.includes(tile.owner);
                        const description = tileDescription(tile, label, startingPlayer) + (inactiveHome ? '. Масть не участвует в партии' : '');
                        const owner = tile.owner ?? startingPlayer?.color;
                        const style = {
                            gridColumn: isPrison ? '6 / 9' : x + 1,
                            gridRow: isPrison ? '6 / 9' : y + 1,
                            ...(owner ? playerStyle(owner) : {}),
                        };
                        return (
                            <button
                                type="button" key={tile.index}
                                className={`cell ${tile.name} ${inactiveHome ? 'inactive-home' : ''} ${startingPlayer ? 'start' : ''} ${isMovable ? 'movable' : ''} ${isSelected ? 'selected' : ''} ${tilePieces.length ? 'occupied' : ''} ${isTarget ? 'drop-target' : ''} ${isTarget && interaction.targetTiles.at(-1) !== tile.index ? 'transfer-entry' : ''} ${isHovered ? 'drop-hover' : ''}`}
                                style={style} disabled={!isMovable && !isTarget} onClick={event => onTileClick(tile.index, event.target.closest('[data-piece-id]')?.dataset.pieceId)}
                                data-tile-index={tile.index} data-tile-type={tile.name} data-movable={String(isMovable)}
                                data-piece-count={tilePieces.length}
                                data-alley-target={tile.name === 'alley' ? tile.moveTo : undefined}
                                data-drop-target={String(isTarget)}
                                aria-label={`${description}${tilePieces.length ? `. Фишек: ${tilePieces.length}` : ''}${isMovable ? isPrison ? '. Нажмите на свою фишку, чтобы вернуть её в руку за одну шестёрку' : '. Можно выбрать для хода' : ''}${isTarget ? '. Сюда можно поставить выбранную фишку' : ''}`}
                                aria-pressed={isSelected} title={description}
                            >
                                {isPrison ? (
                                    <span className="prison-art">
                                        <svg viewBox="0 0 100 100" aria-hidden="true"><path d="M30 65V33Q50 15 70 33V65M25 66H75M34 34H66M39 31V63M50 28V63M61 31V63" fill="none" stroke="currentColor" strokeWidth="3" /><path d="M46 72H54" stroke="currentColor" strokeWidth="2" /></svg>
                                        <span>Тюрьма</span>
                                    </span>
                                ) : <span className="cell-label">{label}</span>}
                                {tilePieces.length > 0 && <TilePieces pieces={tilePieces} interaction={interaction} />}
                            </button>
                        );
                    })}
                </div>
                <Dice visualTheme={visualTheme} />
                {canRoll && <button type="button" className="board-roll-control" onClick={onRoll} aria-label="Бросить кубики" title="Нажмите в любой точке поля, чтобы бросить кубики">
                    <span className="board-roll-cue"><DiceIcon /><strong>Бросить<br />кубики</strong><span>Нажмите на поле</span></span>
                </button>}
                {isRolling && canSkip && <button type="button" className="board-skip-control" onClick={onSkip} aria-label="Пропустить анимацию">
                    <span>Кубики летят…</span><strong>Пропустить</strong>
                </button>}
                {connectionPause && <div className="board-connection-pause" aria-label="Партия на паузе">
                    <div><span className="board-pause-symbol" aria-hidden="true">Ⅱ</span><strong>{connectionPause.title}</strong>
                        <p>{connectionPause.description}</p>
                        {connectionPause.canRetry && <button type="button" className="button button-secondary reconnect-room" onClick={onReconnect}>Подключиться сейчас</button>}
                    </div>
                </div>}
                {results}
            </div>
        </div>
    );
};

export default GameBoard;
