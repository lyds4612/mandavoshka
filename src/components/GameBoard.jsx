import React, {useEffect, useState} from 'react';
import './GameBoard.css';
import {useSelector} from "react-redux";
import {flattened} from "../helpers";
import { selectDice, selectPieces, selectPlayers, selectTileIndexes, selectTiles } from '../store/selectors/gameSelectors';

const FIGURE_SYMBOLS = ['♥', '♦', '♠', '♣'];

const isFigureSymbol = (cell) => FIGURE_SYMBOLS.includes(cell);
const isEmptyCell = (cell) => cell === '';
const isStartPosition = (tileIndex, startPositions) => startPositions.includes(tileIndex);
const isJailTile = (tile) => tile?.name === 'jail';
const isPrisonTile = (tile) => tile?.name === 'prison';
const isSelectedCell = (selectedCell, rowIndex, cellIndex) =>
    selectedCell[0] === rowIndex && selectedCell[1] === cellIndex;

const buildCellClassNames = ({ cell, tileIndex, startPositions, tile, selectedCell, rowIndex, cellIndex }) => {
    const classNames = ['cell', `col-${cellIndex}`];

    if (isPrisonTile(tile))     classNames.push('prison');
    if (isFigureSymbol(cell))   classNames.push(cell);
    if (isEmptyCell(cell))      classNames.push('empty');
    if (isSelectedCell(selectedCell, rowIndex, cellIndex)) classNames.push('selected');

    return classNames.join(' ');
};

const buildCellStyle = ({ tileIndex, startPositions, tile }) => {
    const style = {};

    if (isStartPosition(tileIndex, startPositions)) {
        style.backgroundColor = 'rgba(37,175,56,0.4)';
    }
    if (isJailTile(tile)) {
        style.backgroundColor = '#ff5959';
    }
    if (isPrisonTile(tile)) {
        style.backgroundColor = 'grey';
    }

    return style;
};

const buildCellContent = ({ cell, tileIndex, pieces }) => {
    const playerPieces = flattened(pieces).filter((piece) => piece.tile === tileIndex);

    if (playerPieces.length > 0) {
        return playerPieces.map((piece, i) => (
            <div key={i} className="piece" style={{backgroundColor: piece.color}}/>
        ));
    }

    if (!isEmptyCell(cell)) {
        return cell;
    }

    return null;
};

const GameBoard = ({ board, onTileClick }) => {
    const [selectedCell, setSelectedCell] = useState([]);
    const tileIndexes = useSelector(selectTileIndexes);
    const players = useSelector(selectPlayers);
    const dice = useSelector(selectDice);
    const pieces = useSelector(selectPieces);
    const tiles = useSelector(selectTiles);
    const startPositions = players.map((player) => player.start);

    useEffect(() => {
        setSelectedCell([]);
    }, [dice])

    return (
        <div id="game-board">
            {board.map((row, rowIndex) => (
                <div key={rowIndex} className={`row row-${rowIndex}`}>
                    {row.map((cell, cellIndex) => {
                        const tileIndex = tileIndexes.pos[`${rowIndex}, ${cellIndex}`];
                        const tile = tiles[tileIndex];

                        const style = buildCellStyle({ tileIndex, startPositions, tile });
                        const className = buildCellClassNames({ cell, tileIndex, startPositions, tile, selectedCell, rowIndex, cellIndex });
                        const content = buildCellContent({ cell, tileIndex, pieces });

                        const handleCellClick = () => {
                            const isAlreadySelected = isSelectedCell(selectedCell, rowIndex, cellIndex);
                            setSelectedCell(isAlreadySelected ? [] : [rowIndex, cellIndex]);
                            onTileClick(rowIndex, cellIndex);
                        };

                        return (
                            <div
                                key={cellIndex}
                                style={style}
                                className={className}
                                onClick={handleCellClick}
                            >
                                {content}
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
};

export default GameBoard;
