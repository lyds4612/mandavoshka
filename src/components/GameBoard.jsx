import React from 'react';
import './GameBoard.css';

const GameBoard = ({ board, players, selectedCell, handleClick }) => {
    return (
        <div id="game-board">
            {board.map((row, rowIndex) => (
                <div key={rowIndex} className={`row row-${rowIndex}`}>
                    {row.map((cell, cellIndex) => {
                        // const playerPiece = players.find(player =>
                            // player.pieces.some(([r, c]) => r === rowIndex && c === cellIndex)
                        // );
                        return (
                            <div
                                key={cellIndex}
                                className={`cell row-${rowIndex} col-${cellIndex} ${selectedCell && selectedCell.row === rowIndex && selectedCell.col === cellIndex ? 'selected' : ''}`}
                                onClick={() => handleClick(rowIndex, cellIndex)}
                            >
                                {cell}
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
};

export default GameBoard;
