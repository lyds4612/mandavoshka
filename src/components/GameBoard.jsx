import React from 'react';
import './GameBoard.css';

const GameBoard = ({ board, players, selectedCell, handleClick }) => {
    return (
        <div id="game-board">
            {board.map((row, rowIndex) => (
                <div key={rowIndex} className="row">
                    {row.map((cell, cellIndex) => {
                        const playerPiece = players.find(player =>
                            player.positions.some(([r, c]) => r === rowIndex && c === cellIndex)
                        );
                        return (
                            <div
                                key={cellIndex}
                                className={`cell ${cell} ${selectedCell && selectedCell.row === rowIndex && selectedCell.col === cellIndex ? 'selected' : ''}`}
                                onClick={() => handleClick(rowIndex, cellIndex)}
                            >
                                {playerPiece ? <div className="piece" style={{ backgroundColor: playerPiece.color }}></div> : cell}
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
};

export default GameBoard;
