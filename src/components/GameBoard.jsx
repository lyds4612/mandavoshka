import React, {useState} from 'react';
import './GameBoard.css';
import {useSelector} from "react-redux";
import {flattened} from "../helpers";

const GameBoard = ({ board, onTileClick }) => {
    const [selectedCell, setSelectedCell] = useState([]);
    const tileIndexes  = useSelector((state) => state.game.tileIndexes)
    const players = useSelector((state) => state.game.players);
    const pieces = useSelector((state) => state.game.pieces);
    const tiles = useSelector((state) => state.game.tiles);
    const startPositions = players.map((player) => {
        return player.start;
    })

    return (
        <div id="game-board">
            {board.map((row, rowIndex) => (
                <div key={rowIndex} className={`row row-${rowIndex}`}>
                    {row.map((cell, cellIndex) => {
                        const style = {};
                        const tileIndex = tileIndexes.pos[`${rowIndex}, ${cellIndex}`];

                        if (startPositions.includes(tileIndex)) {
                            style.backgroundColor = 'rgba(37,175,56,0.4)'
                        }
                        const tile = tiles[tileIndex];

                        if (tile && tile.name === 'jail') {
                            style.backgroundColor = 'red'
                        }

                        const classNames = ['cell', `col-${cellIndex}`]
                        if(selectedCell && selectedCell[0] === rowIndex && selectedCell[1] === cellIndex) {
                            classNames.push('selected')
                        }

                        const figures = ['♥', '♦', '♠', '♣']
                        if (figures.includes(cell)) {
                            classNames.push(cell)
                        }

                        if (cell === '') {
                            classNames.push('empty');
                        } else if (cell === '⛓️') {
                            classNames.push('prison');
                        }


                        const className = classNames.join(' ');

                        let Content;

                        const playerPieces = flattened(pieces).filter(piece => piece.tile === tileIndex);
                        if (playerPieces.length > 0) {
                            Content = playerPieces.map((piece) => {
                                return <div className="piece" style={{backgroundColor: piece.color}}></div>
                            })
                        }
                        else if (cell !== '') {
                            Content = cell;
                        }

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
                                {Content}
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
};

export default GameBoard;
