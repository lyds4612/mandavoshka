import React, {useState} from 'react';
import './GameBoard.css';

const GameBoard = ({ board, players, onTileClick }) => {
    const [selectedCell, setSelectedCell] = useState([]);

    return (
        <div id="game-board">
            {board.map((row, rowIndex) => (
                <div key={rowIndex} className={`row row-${rowIndex}`}>
                    {row.map((cell, cellIndex) => {

                        return (
                            <div
                                key={cellIndex}
                                className={`cell col-${cellIndex} ${selectedCell && selectedCell[0] === rowIndex && selectedCell[1] === cellIndex ? 'selected' : ''}`}
                                onClick={() => {
                                    if (selectedCell[0] === rowIndex && selectedCell[1] === cellIndex) {
                                        setSelectedCell([]);
                                    } else {
                                        setSelectedCell([rowIndex, cellIndex]);
                                    }
                                    onTileClick(rowIndex, cellIndex);
                                }}
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
