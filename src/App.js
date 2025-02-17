// App.js
import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import './App.css';
import GameBoard from './components/GameBoard';
import Dice from './components/Dice';
import {movePiece, placePiece, resetGame, rollDice} from "./store/gameSlice";

// This function creates a board representation (e.g. for display)
function createInitialBoard() {
    const d = '♦';
    const h = '♥';
    const c = '♣';
    const s = '♠';
    return [
        ['',     5,    4,    3,    2,    1,    0,     1,    2,    3,     4,       5,   ''],
        [5,  'III', 'II',  'I',   '',   '',    1,    '',   '',   '',    '',   'III',    5],
        [4,     '',   '',   '',   '',   '',    2,    '',   '',   '',    '',    'II',    4],
        [3,     '',   '',    d,   '',   '',    3,    '',   '',    h,    '',     'I',    3],
        [2,     '',   '',   '',   '',   '',    4,    '',   '',   '',    '',      '',    2],
        [1,     '',   '',   '',   '',  '|',  '|',   '|',   '',   '',    '',      '',    1],
        [0,      1,    2,    3,    4,  '-',   '',   '-',    4,    3,     2,       1,    0],
        [1,     '',   '',   '',   '',  '|',  '|',   '|',   '',   '',    '',      '',    1],
        [2,     '',   '',   '',   '',   '',    4,    '',   '',   '',    '',      '',    2],
        [3,    'I',   '',    c,   '',   '',    3,    '',   '',    s,    '',      '',    3],
        [4,   'II',   '',   '',   '',   '',    2,    '',   '',   '',    '',      '',    4],
        [5,  'III',   '',   '',   '',   '',    1,    '',   '',   'I',  'II',  'III',    5],
        ['',     5,    4,    3,    2,    1,    0,     1,    2,     3,     4,      5,   ''],
    ];
}

// This helper calculates board cell positions (if needed for your UI)
function calculateBoardIndexes() {
    let move = [];
    let pos = [0, 0];
    let indexes = [];
    const rotate = () => {
        if (!move[0] && !move[1]) {
            move = [1, 0];
        } else if (move[0] === 1 && move[1] === 0) {
            move = [0, 1];
        } else if (move[0] === 0 && move[1] === 1) {
            move = [-1, 0];
        } else if (move[0] === -1 && move[1] === 0) {
            move = [0, -1];
        }
    };
    const side = 13;
    const max = side * 4;
    for (let i = 0; i < max; i++) {
        if (i !== 0) {
            if (move[0] !== 0) {
                pos[0] += move[0];
            }
            if (move[1] !== 0) {
                pos[1] += move[1];
            }
        }
        indexes.push([pos[1], pos[0]]);
        if ((i % side) === 0) {
            rotate();
        }
    }
    return indexes;
}

const App = () => {
    const dispatch = useDispatch();

    const tiles = useSelector((state) => state.game.tiles);
    const players = useSelector((state) => state.game.players);
    const currentPlayer = useSelector((state) => state.game.currentPlayer);
    const dice = useSelector((state) => state.game.dice);
    const canRoll = useSelector((state) => state.game.canRoll);
    const canMove = useSelector((state) => state.game.canMove);
    const canPlace = useSelector((state) => state.game.canPlace);
    const moves = useSelector((state) => state.game.moves);

    const [selectedTile, setSelectedTile] = useState(null);
    const [cellIndexes] = useState(calculateBoardIndexes());
    const board = createInitialBoard();

    const findCellIndex = (rowIndex, cellIndex) => {
        return cellIndexes.findIndex(
            ([x, y]) => x === rowIndex && y === cellIndex
        );
    };

    function selectTile(rowIndex, cellIndex) {
        const index = findCellIndex(rowIndex, cellIndex);
        console.log('Tile clicked at:', rowIndex, cellIndex, index);
        if (index === -1) {
            console.error(`Tile not found with index: ${index}`);
            return;
        }

        const tile = tiles[index];
        setSelectedTile(tile);
    }

    const handleRollDice = () => {
        dispatch(rollDice());
    };

    const handlePlacePiece = () => {
        dispatch(placePiece());
    };

    const handleMovePiece = () => {
        dispatch(movePiece({ dice: dice[0], pieceIndex: 0 }));
    };

    const { color, pieces } = currentPlayer;
    const Pieces = pieces.map((piece, index) => (
        <div key={index} className="piece" style={{ backgroundColor: piece.color }}>
            {index}
        </div>
    ));

    return (
        <div className="App">
            <h1>ПОД ШКОНКУ, МАНДАВОШКА!</h1>
            <ResetGame/>
            <GameBoard board={board} players={players} onTileClick={selectTile} />
            <Dice dice={dice} />
            <button disabled={!canRoll} onClick={handleRollDice}>БРОСАЙ КУБИК</button>
            <div className="current-player">
                <div>
                    ТЕКУЩИЙ ИГРОК: <span style={{ color }}>{color}</span>
                </div>
                <div>Ходов: {moves.length}</div>
                <div className="remaining-pieces">{Pieces}</div>
               <button disabled={!canPlace} onClick={handlePlacePiece}>ПОСТАВИТЬ ФИГУРУ</button>
               <button disabled={!selectedTile && !canMove} onClick={handleMovePiece}>ПЕРЕДВИНУТЬ ФИГУРУ</button>
            </div>
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
