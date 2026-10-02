import {useState} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import './App.css';
import GameBoard from './components/GameBoard';
import { DiceResult } from './components/Dice';
import {finishDiceRoll, movePiece, placePiece, resetGame, rollDice} from "./store/gameSlice";
import {
    selectActionFlags,
    selectCurrentPlayerColor,
    selectCurrentPlayerPieces,
    selectGameState,
    selectIsRolling,
    selectMovableTileIndexes,
    selectMoves,
    selectPieces,
    selectPlayers,
    selectTurnMessage,
    selectWinner,
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

const renderHandPieces = (pieces, color) => {
    return pieces
        .filter((piece) => piece.tile === null)
        .map((piece, index) => (
            <div className="piece" key={`${color}-hand-${index}`} style={{backgroundColor: color}}/>
        ));
};

const summarizePieces = ({ pieces, tiles, prisonTileIndex }) => pieces.reduce((summary, piece) => {
    const tile = tiles[piece.tile];
    if (piece.tile === null) summary.hand += 1;
    else if (piece.tile === prisonTileIndex) summary.prison += 1;
    else if (tile?.name === 'jail') summary.jail += 1;
    else if (tile?.name === 'home') summary.home += 1;
    else summary.field += 1;
    return summary;
}, { hand: 0, field: 0, jail: 0, prison: 0, home: 0 });

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
    currentPlayerPieces,
    turnMessage,
    winner,
    isRolling,
    onSkipAnimation,
}) => {
    return (
        <div className="current-player">
            <DiceResult />
            <button disabled={!canRoll || Boolean(winner)} aria-busy={isRolling} onClick={onRollDice}>
                {isRolling ? 'КУБИКИ ЛЕТЯТ…' : 'БРОСИТЬ КУБИКИ'}
            </button>
            <div className="roll-animation-action">
                {isRolling && <button className="skip-animation" onClick={onSkipAnimation}>Пропустить анимацию</button>}
            </div>
            <div>
                ТЕКУЩИЙ ИГРОК: <span style={{color: currentPlayerColor}}>{currentPlayerColor}</span>
            </div>
            <div>Осталось значений: {moves.length}</div>
            <div className="turn-message" role="status">{turnMessage}</div>
            {winner && <div className="winner-message">Победил игрок {winner}!</div>}
            <div>Фишки в руке:</div>
            <div className="remaining-pieces">{renderHandPieces(currentPlayerPieces, currentPlayerColor)}</div>
            <div>
                <button disabled={!canPlace} onClick={onPlacePiece}>ПОСТАВИТЬ ФИГУРУ</button>
                <button disabled={selectedTile === null || !canMove} onClick={onMovePiece}>ПЕРЕДВИНУТЬ ФИГУРУ</button>
            </div>
        </div>
    );
};

const PlayersOnBoard = ({ players, pieces, currentPlayerColor, tiles, prisonTileIndex }) => {
    return (
        <div className='players-on-board'>
            <div className='player'>
                <div className="what-a-player">Игрок:</div>
                <div className="pieces" style={{alignItems: 'center', paddingBottom: '6px'}}>Состояние фишек:</div>
                <div className="last-move" style={{paddingTop: '5px'}}>Последний ход:</div>
            </div>
            {players.map(({color, lastDice})=> {
                const style = {
                    color,
                    borderTopColor: currentPlayerColor === color && color
                };
                const summary = summarizePieces({
                    pieces: pieces[color],
                    tiles,
                    prisonTileIndex,
                });

                return (
                    <div key={color} className="player" style={style}>
                        {color}
                        <div className="piece-summary">
                            <span>рука {summary.hand}</span>
                            <span>поле {summary.field}</span>
                            <span>СИЗО {summary.jail}</span>
                            <span>тюрьма {summary.prison}</span>
                            <span>хата {summary.home}</span>
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
    const game = useSelector(selectGameState);
    const currentPlayerColor = useSelector(selectCurrentPlayerColor);
    const currentPlayerPieces = useSelector(selectCurrentPlayerPieces);
    const pieces = useSelector(selectPieces);
    const moves = useSelector(selectMoves);
    const players = useSelector(selectPlayers);
    const movableTileIndexes = useSelector(selectMovableTileIndexes);
    const turnMessage = useSelector(selectTurnMessage);
    const winner = useSelector(selectWinner);
    const isRolling = useSelector(selectIsRolling);
    const { canRoll, canMove, canPlace } = useSelector(selectActionFlags);

    const [selectedTileIndex, setSelectedTileIndex] = useState(null);

    const handleSelectTile = (tileIndex) => {
        setSelectedTileIndex((selected) => selected === tileIndex ? null : tileIndex);
    };

    const handleRollDice = () => {
        setSelectedTileIndex(null);
        dispatch(rollDice());
    };

    const handlePlacePiece = () => {
        setSelectedTileIndex(null);
        dispatch(placePiece());
    };

    const handleMovePiece = () => {
        if (selectedTileIndex === null) {
            return;
        }

        dispatch(movePiece(selectedTileIndex));
        setSelectedTileIndex(null);
    };

    const handleReset = () => {
        setSelectedTileIndex(null);
        dispatch(resetGame());
    };

    return (
        <div
            className="App"
            data-current-player={currentPlayerColor}
            data-winner={winner ?? ''}
        >
            <div>
                <div>
                    <h1>ПОД ШКОНКУ, МАНДАВОШКА!</h1>
                    <button onClick={handleReset}>НАЧАТЬ ЗАНОВО</button>
                </div>
                <GameBoard
                    board={board}
                    onTileClick={handleSelectTile}
                    selectedTileIndex={selectedTileIndex}
                    movableTileIndexes={movableTileIndexes}
                />
            </div>

            <CurrentPlayerPanel
                canRoll={canRoll}
                canMove={canMove}
                canPlace={canPlace}
                currentPlayerColor={currentPlayerColor}
                moves={moves}
                selectedTile={selectedTileIndex}
                onRollDice={handleRollDice}
                onPlacePiece={handlePlacePiece}
                onMovePiece={handleMovePiece}
                currentPlayerPieces={currentPlayerPieces}
                turnMessage={turnMessage}
                winner={winner}
                isRolling={isRolling}
                onSkipAnimation={() => dispatch(finishDiceRoll(game.diceRoll?.id))}
            />

            <PlayersOnBoard
                players={players}
                pieces={pieces}
                currentPlayerColor={currentPlayerColor}
                tiles={game.tiles}
                prisonTileIndex={game.prisonTileIndex}
            />
        </div>
    );
};

export default App;
