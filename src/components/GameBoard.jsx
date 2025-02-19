import React, {useState} from 'react';
import './GameBoard.css';
import {useSelector} from "react-redux";

const GameBoard = ({ board, onTileClick }) => {
    const [selectedCell, setSelectedCell] = useState([]);
    const tileIndexes  = useSelector((state) => state.game.tileIndexes)
    const players = useSelector((state) => state.game.players);
    const tiles = useSelector((state) => state.game.tiles);
    const startPositions = players.map((player) => {
        return player.start;
    })

    console.log(startPositions);

    return (
        <div id="game-board">
            {board.map((row, rowIndex) => (
                <div key={rowIndex} className={`row row-${rowIndex}`}>
                    {row.map((cell, cellIndex) => {
                        const style = {};
                        const tileIndex = tileIndexes.pos[`${rowIndex}, ${cellIndex}`];

                        if (startPositions.includes(tileIndex)) {
                            style.backgroundColor = 'green'
                        }

                        if (tileIndex > -1) {
                            const tile = tiles[tileIndex];


                            if (tile.name === 'jail') {
                                style.backgroundColor = 'red'
                            }
                        }

                        const classNames = ['cell', `col-${cellIndex}`]
                        if(selectedCell && selectedCell[0] === rowIndex && selectedCell[1] === cellIndex) {
                            classNames.push('selected')
                        }

                        // if (cell === '') {
                        //     classNames.push('empty');
                        // }

                        const className = classNames.join(' ');

                        return (
                            <div
                                key={cellIndex}
                                style={style}
                                className={className}
                                onClick={() => {
                                    if (selectedCell[0] === rowIndex && selectedCell[1] === cellIndex) {
                                        setSelectedCell([]);
                                    } else {
                                        setSelectedCell([rowIndex, cellIndex]);
                                    }
                                    onTileClick(rowIndex, cellIndex);
                                }}
                            >
                                {cell !== '' && cell}
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
};

export default GameBoard;
