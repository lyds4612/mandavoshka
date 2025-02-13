import React, {useEffect, useState} from 'react';
import './App.css';
import GameBoard from './components/GameBoard';
import Dice from './components/Dice';
import gameState from "./logic/logic";

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
const board = createInitialBoard();

function calculateBoardIndexes () {
    let move = [];
    let pos = [0, 0];
    let indexes = []
    const rotate = () => {
        const [x, y] = move;
        if (!x && !y) {
            move = [1, 0];
        }
        if (x === 1 && y === 0) {
            move = [0, 1];
        }
        if (x === 0 && y === 1) {
            move = [-1, 0];
        }
        if (x === -1 && y === 0) {
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
    const [state] = useState(gameState);
    const [updateCount, setUpdateCount] = useState(0);
    const [dice, setDice] = useState(['-', '-']);
    const [selectedTile, setSelectedTile] = useState(null);
    const [cellIndexes] = useState(calculateBoardIndexes());
    const [canPlace, setCanPlace] = useState(false);
    const [canMove, setCanMove] = useState(false);
    const [canRoll, setCanRoll] = useState(true);


    useEffect(() => {
        console.log(updateCount);
        console.log(gameState);
        console.log(canMove,
            canPlace,
            canRoll);
    });

    const forceUpdate = () => setUpdateCount((prev) => prev + 1);

    const findCellIndex = (rowIndex, cellIndex) => {
        return cellIndexes.findIndex(([x, y]) => x === rowIndex && y === cellIndex);
    };

    function selectTile(rowIndex, cellIndex) {
        console.log('Tile clicked at:', rowIndex, cellIndex);
        const index = findCellIndex(rowIndex, cellIndex);
        if (index === -1) {
            console.error(`Tile not found with index: ${index}`);
            return;
        }
        const tile = state.tiles[index];
        setSelectedTile(tile);
        forceUpdate();
    }

    function rollDice() {
        const {
            canMove,
            canPlace,
            canRoll,
            dice: newDice
        } = state.rollDice(state.player);
        setCanMove(canMove);
        setCanPlace(canPlace);
        setCanRoll(canRoll);

        setDice(newDice);
        forceUpdate();
    }

    function placePiece() {
        const {
            canMove,
            canPlace,
            canRoll,
            dice: newDice
        } = state.placePiece(state.player);
        setCanMove(canMove);
        setCanPlace(canPlace);
        setCanRoll(canRoll);

        setDice(newDice);
        forceUpdate();
    }

    function movePiece() {
        const piece = state.player.pieces[0];
        if (piece) {
            const index = state.movePiece(dice[0], piece);
            forceUpdate();
        }
    }

    const {color, pieces} = state.player;
    const Pieces = pieces.map((piece, index) => (
        <div key={index} className="piece" style={{ backgroundColor: piece.color }}></div>
    ))

    return (
        <div className="App">
            <h1>ПОД ШКОНКУ, МАНДАВОШКА!</h1>
            <GameBoard board={board} players={state.players} onTileClick={selectTile}/>

            <Dice dice={dice}/>
            {canRoll && <button onClick={rollDice}>БРОСАЙ КУБИК</button>}
            <div className="current-player">
                <div>
                    ТЕКУЩИЙ ИГРОК: <span style={{color}}>{color}</span>
                </div>
                <div className="remaining-pieces">
                    {Pieces}
                </div>
                {canPlace && <button onClick={placePiece}>ПОСТАВИТЬ ФИГУРУ</button>}
                {canMove && <button disabled={!selectedTile} onClick={movePiece}>ПЕРЕДВИНУТЬ ФИГУРУ</button>}
            </div>
        </div>
    );
};

export default App;
