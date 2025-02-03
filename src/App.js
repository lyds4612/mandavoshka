import React, { useState } from 'react';
import './App.css';
import GameBoard from './components/GameBoard';
import Dice from './components/Dice';
import Player from './components/Player';

const App = () => {
    const [board, setBoard] = useState(createInitialBoard());
    const [players, setPlayers] = useState(createInitialPlayers());
    const [selectedCell, setSelectedCell] = useState(null);
    const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
    const [dice, setDice] = useState([1, 1]);
    const [moves, setMoves] = useState([0, 0]);
    const [canPlacePiece, setCanPlacePiece] = useState(false);
    const [moveIndex, setMoveIndex] = useState(0);

    function createInitialBoard() {
        const cells = [];
        for (let i = 0; i < 13; i++) {
            const row = [];
            for (let j = 0; j < 13; j++) {
                let value = '';
                if (i === 0 && j > 0 && j < 12) {
                    value = j;
                } else if (i === 12 && j > 0 && j < 12) {
                    value = j;
                } else if (j === 0 && i > 0 && i < 12) {
                    value = i;
                } else if (j === 12 && i > 0 && i < 12) {
                    value = i;
                } else if ((i === 5 && j === 5) || (i === 5 && j === 7) || (i === 7 && j === 5) || (i === 7 && j === 7)) {
                    value = getCardSuit(i, j);
                } else if ((i >= 5 && i <= 7) && (j >= 5 && j <= 7)) {
                    value = '';
                }
                row.push(value);
            }
            cells.push(row);
        }
        return cells;
    }

    function createInitialPlayers() {
        return [
            { id: 1, color: 'red', positions: [], start: [0, 6], path: generatePath([0, 6]), pieces: 4 },
            { id: 2, color: 'blue', positions: [], start: [6, 12], path: generatePath([6, 12]), pieces: 4 },
            { id: 3, color: 'green', positions: [], start: [12, 6], path: generatePath([12, 6]), pieces: 4 },
            { id: 4, color: 'yellow', positions: [], start: [6, 0], path: generatePath([6, 0]), pieces: 4 }
        ];
    }

    function generatePath(start) {
        const path = [];
        let [row, col] = start;

        while (true) {
            path.push([row, col]);
            if (row === 0 && col < 12) col++;
            else if (col === 12 && row < 12) row++;
            else if (row === 12 && col > 0) col--;
            else if (col === 0 && row > 0) row--;

            if (row === start[0] && col === start[1]) break;
        }
        return path;
    }

    function getCardSuit(i, j) {
        if (i === 5 && j === 5) return '♦';
        if (i === 5 && j === 7) return '♥';
        if (i === 7 && j === 5) return '♣';
        if (i === 7 && j === 7) return '♠';
        return '';
    }

    function handleClick(row, col) {
        setSelectedCell({ row, col });
    }

    function rollDice() {
        const newDice = [Math.ceil(Math.random() * 6), Math.ceil(Math.random() * 6)];
        setDice(newDice);

        let newPlayers = [...players];
        let currentPlayer = newPlayers[currentPlayerIndex];

        if (newDice.includes(6)) {
            setCanPlacePiece(true);
            const remainingMoves = newDice[0] === 6 ? newDice[1] : newDice[0];
            setMoves([6, remainingMoves]);
        } else {
            const sortedDice = newDice.sort((a, b) => b - a);
            setMoves(sortedDice);
            setMoveIndex(0);
        }

        setPlayers(newPlayers);
    }

    function placePiece() {
        if (canPlacePiece) {
            let newPlayers = [...players];
            let currentPlayer = newPlayers[currentPlayerIndex];

            if (currentPlayer.pieces > 0) {
                currentPlayer.positions.push(currentPlayer.start);
                currentPlayer.pieces--;
                setPlayers(newPlayers);
                setCanPlacePiece(false);
            }
        }
    }

    function movePiece() {
        if (selectedCell && moves[moveIndex] > 0) {
            let newPlayers = [...players];
            let currentPlayer = newPlayers[currentPlayerIndex];
            let positionIndex = currentPlayer.positions.findIndex(
                ([r, c]) => r === selectedCell.row && c === selectedCell.col
            );

            if (positionIndex > -1) {
                let newPosition = calculateNewPosition(currentPlayer.positions[positionIndex], moves[moveIndex], currentPlayer.path);
                currentPlayer.positions[positionIndex] = newPosition;
                setPlayers(newPlayers);
                setMoves(prevMoves => {
                    const newMoves = [...prevMoves];
                    newMoves[moveIndex] = 0;
                    return newMoves;
                });
                setSelectedCell(null);

                if (moveIndex === 0) {
                    setMoveIndex(1);
                } else {
                    setMoveIndex(0);
                    setCurrentPlayerIndex((currentPlayerIndex + 1) % players.length);
                }
            }
        }
    }

    function calculateNewPosition([row, col], moves, path) {
        let currentIndex = path.findIndex(([r, c]) => r === row && c === col);
        let newIndex = (currentIndex + moves) % path.length;
        return path[newIndex];
    }

    const currentPlayer = players[currentPlayerIndex];
    return (
        <div className="App">
            <h1>ПОД ШКОНКУ, МАНДАВОШКА!</h1>
            <GameBoard board={board} players={players} selectedCell={selectedCell} handleClick={handleClick} />
            <Dice dice={dice} rollDice={rollDice} />
            <Player currentPlayer={currentPlayer} placePiece={placePiece} canPlacePiece={canPlacePiece} />
            <button onClick={movePiece}>ПЕРЕДВИНУТЬ ФИГУРУ</button>
        </div>
    );
};

export default App;
