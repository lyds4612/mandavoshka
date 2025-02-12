import React, { useState } from 'react';
import './App.css';
import GameBoard from './components/GameBoard';
import Dice from './components/Dice';
import Player from './components/Player';
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
    let move = [];
    let pos = [0, 0];
    let index = []
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
    const side = 12;
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
        index.push([pos[1], pos[0]]);
        if ((i % side) === 0) {
            rotate();
        }
    }

const App = () => {
    const [state] = useState(gameState)
    const [board] = useState(createInitialBoard());
    const [selectedCell, setSelectedCell] = useState(null);
    const [dice, setDice] = useState([1, 1]);
    const [canPlacePiece] = useState(false);
    const [player] = useState(state.player);

    function handleClick(row, col) {
        setSelectedCell({ row, col });
    }

    function rollDice() {
        setDice(state.rollDice(player))
    }

    function placePiece(dice, piece) {

    }

    return (
        <div className="App">
            <h1>ПОД ШКОНКУ, МАНДАВОШКА!</h1>
            <GameBoard board={board} players={state.players} selectedCell={selectedCell} handleClick={handleClick} />
            <Dice dice={dice} rollDice={rollDice} />
            <Player currentPlayer={player} placePiece={placePiece} canPlacePiece={canPlacePiece} />
            <button onClick={state.movePiece}>ПЕРЕДВИНУТЬ ФИГУРУ</button>
        </div>
    );
};

export default App;
