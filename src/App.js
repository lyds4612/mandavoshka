import {useState} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import './App.css';
import GameBoard from './components/GameBoard';
import Dice from './components/Dice';
import {movePiece, placePiece, resetGame, rollDice, endTurn} from "./store/gameSlice";
import {
    selectActionFlags,
    selectCurrentPlayerColor,
    selectCurrentPlayerPieces,
    selectMoves,
    selectPieces,
    selectPlayers,
    selectTileIndexes,
    selectTiles,
} from './store/selectors/gameSelectors';

const board = createInitialBoard();

function createInitialBoard() {
    const d = '♦';
    const h = '♥';
    const c = '♣';
    const s = '♠';

    const up = '↑';
    const down = '↓';
    const left = '←';
    const right = '→';

    return [
        [6,     5,    4,    right,    2,    1,    0,     1,    2,    3,     4,       5,   6],
        [5,  left, 'II',  'I',   '',   '',    1,    '',   '',   '',    '',   down,    5],
        [4,     '',   '',   '',   '',   '',    2,    '',   '',   '',    '',    'II',    4],
        [3,     '',   '',    d,   '',   '',    3,    '',   '',    h,    '',     'I',    up],
        [2,     '',   '',   '',   '',   '',    4,    '',   '',   '',    '',      '',    2],
        [1,     '',   '',   '',   '',  '',  '',   '',   '',   '',    '',      '',    1],
        [0,      1,    2,    3,    4,  '',   '⛓️',   '',    4,    3,     2,       1,    0],
        [1,     '',   '',   '',   '',  '',  '',   '',   '',   '',    '',      '',    1],
        [2,     '',   '',   '',   '',   '',    4,    '',   '',   '',    '',      '',    2],
        [down,    'I',   '',    c,   '',   '',    3,    '',   '',    s,    '',      '',    3],
        [4,   'II',   '',   '',   '',   '',    2,    '',   '',   '',    '',      '',    4],
        [5,  up,   '',   '',   '',   '',    1,    '',   '',   'I',  'II',  right,    5],
        [6,     5,    4,    3,    2,    1,    0,     1,    2,     left,     4,      5,   6],
    ];
}

const buildTilePositionKey = (rowIndex, cellIndex) => `${rowIndex}, ${cellIndex}`;

const findTileByBoardPosition = ({ tileIndexes, tiles, rowIndex, cellIndex }) => {
    const tileIndex = tileIndexes.pos[buildTilePositionKey(rowIndex, cellIndex)];
    if (tileIndex === undefined || tileIndex === -1) {
        return null;
    }

    return tiles[tileIndex] ?? null;
};

const renderBoardPiecesByColor = (piecesOrMap, color) => {
    const pieces = Array.isArray(piecesOrMap) ? piecesOrMap : piecesOrMap[color];

    return pieces.map((piece, i) => {
        if (piece.tile !== null) {
            return <div className="piece" key={color + i} style={{border: `solid, ${piece.color} 1px`}}></div>;
        }
        return <div className="piece" key={color + i} style={{backgroundColor: color}}></div>;
    }).reverse();
};

const CurrentPlayerPanel = ({
    canRoll,
    canMove,
    canPlace,
    currentPlayerColor,
    moves,
    selectedTile,
    onRollDice,
    onPlacePiece,
    onMovePiece,
    onMoveEnd,
    currentPlayerPieces,
}) => {
    return (
        <div className="current-player">
            <Dice/>
            <button disabled={!canRoll} onClick={onRollDice}>БРОСАЙ КУБИК</button>
            <div>
                ТЕКУЩИЙ ИГРОК: <span style={{color: currentPlayerColor}}>{currentPlayerColor}</span>
            </div>
            <div>Ходов: {moves.length}</div>
            <div className="remaining-pieces">{renderBoardPiecesByColor(currentPlayerPieces, currentPlayerColor)}</div>
            <div>
                <button disabled={!canPlace} onClick={onPlacePiece}>ПОСТАВИТЬ ФИГУРУ</button>
                <button disabled={!selectedTile || !canMove} onClick={onMovePiece}>ПЕРЕДВИНУТЬ ФИГУРУ</button>
                <button onClick={onMoveEnd}>[DEV] Закончить ход</button>
            </div>
        </div>
    );
};

const PlayersOnBoard = ({ players, pieces, currentPlayerColor }) => {
    return (
        <div className='players-on-board'>
            <div className='player'>
                <div className="what-a-player">Игрок:</div>
                <div className="pieces" style={{alignItems: 'center', paddingBottom: '6px'}}>Количество фишек:</div>
                <div className="last-move" style={{paddingTop: '5px'}}>Последний ход:</div>
            </div>
            {players.map(({color, lastDice})=> {
                const style = {
                    color,
                    borderTopColor: currentPlayerColor === color && color
                };

                return (
                    <div key={color} className="player" style={style}>
                        {color}
                        <div className="pieces">
                            {renderBoardPiecesByColor(pieces, color)}
                        </div>
                        <div className="last-dice">{lastDice?.join(' : ')}</div>
                    </div>
                );
            })}
        </div>
    );
};


const App = () => {
    const dispatch = useDispatch();
    const tileIndexes = useSelector(selectTileIndexes);
    const tiles = useSelector(selectTiles);
    const currentPlayerColor = useSelector(selectCurrentPlayerColor);
    const currentPlayerPieces = useSelector(selectCurrentPlayerPieces);
    const pieces = useSelector(selectPieces);
    const moves = useSelector(selectMoves);
    const players = useSelector(selectPlayers);
    const { canRoll, canMove, canPlace } = useSelector(selectActionFlags);

    const [selectedTile, setSelectedTile] = useState(null);

    const handleSelectTile = (rowIndex, cellIndex) => {
        const tile = findTileByBoardPosition({
            tileIndexes,
            tiles,
            rowIndex,
            cellIndex,
        });

        if (!tile) {
            console.error(`Tile not found at: ${rowIndex}, ${cellIndex}`);
            return;
        }

        console.log(`tile clicked ${tile.name} ${tile.index}`);

        setSelectedTile(tile);
    };

    const handleRollDice = () => {
        dispatch(rollDice());
    };

    const handlePlacePiece = () => {
        dispatch(placePiece());
    };

    const handleMovePiece = () => {
        if (!selectedTile) {
            return;
        }

        dispatch(movePiece(selectedTile.index));
    };

    const handleMoveEnd = () => {
        dispatch(endTurn());
    }

    return (
        <div className="App">
            <div>
                <div>
                    <h1>ПОД ШКОНКУ, МАНДАВОШКА!</h1>
                    <ResetGame/>
                </div>
                <GameBoard board={board} onTileClick={handleSelectTile}/>
            </div>

            <CurrentPlayerPanel
                canRoll={canRoll}
                canMove={canMove}
                canPlace={canPlace}
                currentPlayerColor={currentPlayerColor}
                moves={moves}
                selectedTile={selectedTile}
                onRollDice={handleRollDice}
                onPlacePiece={handlePlacePiece}
                onMovePiece={handleMovePiece}
                onMoveEnd={handleMoveEnd}
                currentPlayerPieces={currentPlayerPieces}
            />

            <PlayersOnBoard
                players={players}
                pieces={pieces}
                currentPlayerColor={currentPlayerColor}
            />
        </div>
    );
};

const ResetGame = () => {
    const dispatch = useDispatch();

    const onClick = () => {
        dispatch(resetGame());
    }
    return <button onClick={onClick}>
        Reset
    </button>
}

export default App;
