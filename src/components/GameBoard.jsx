import React from 'react';
import './GameBoard.css';
import AlleyArrows from './AlleyArrows';
import Dice from './Dice';
import {useSelector} from "react-redux";
import {flattened} from "../helpers";
import { selectPieces, selectPlayers, selectTileIndexes, selectTiles } from '../store/selectors/gameSelectors';

const FIGURE_SYMBOLS = ['♥', '♦', '♠', '♣'];
const CELL_SIZE = 50;
const CELL_GAP = 5;

const isFigureSymbol = (cell) => FIGURE_SYMBOLS.includes(cell);
const isEmptyCell = (cell) => cell === '';
const isStartPosition = (tileIndex, startPositions) => startPositions.includes(tileIndex);
const isJailTile = (tile) => tile?.name === 'jail';
const isPrisonTile = (tile) => tile?.name === 'prison';
const isHomeTile = (tile) => tile?.name === 'home';
const isAlleyTile = (tile) => tile?.name === 'alley';

const buildCellClassNames = ({ cell, tile, isSelected, isMovable, cellIndex }) => {
    const classNames = ['cell', `col-${cellIndex}`];

    if (isPrisonTile(tile))     classNames.push('prison');
    if (isHomeTile(tile))       classNames.push('home');
    if (isAlleyTile(tile))      classNames.push('alley');
    if (isFigureSymbol(cell))   classNames.push(cell);
    if (isEmptyCell(cell))      classNames.push('empty');
    if (isSelected)             classNames.push('selected');
    if (isMovable)              classNames.push('movable');

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
    if (isHomeTile(tile)) {
        const homeColors = {
            green: 'rgba(0, 128, 0, 0.24)',
            black: 'rgba(0, 0, 0, 0.18)',
            red: 'rgba(255, 0, 0, 0.22)',
            orange: 'rgba(255, 165, 0, 0.28)',
        };
        style.backgroundColor = homeColors[tile.owner];
    }

    return style;
};

const buildCellContent = ({ cell, tileIndex, pieces }) => {
    const playerPieces = flattened(pieces).filter((piece) => piece.tile === tileIndex);

    if (playerPieces.length > 0) {
        return playerPieces.map((piece, i) => (
            <div
                key={i}
                className="piece"
                data-piece-color={piece.color}
                data-piece-progress={piece.progress ?? ''}
                style={{backgroundColor: piece.color}}
            />
        ));
    }

    if (!isEmptyCell(cell)) {
        return cell;
    }

    return null;
};

const GameBoard = ({ board, onTileClick, selectedTileIndex, movableTileIndexes }) => {
    const tileIndexes = useSelector(selectTileIndexes);
    const players = useSelector(selectPlayers);
    const pieces = useSelector(selectPieces);
    const tiles = useSelector(selectTiles);
    const startPositions = players.map((player) => player.start);

    return (
        <div
            id="game-board"
            style={{ '--cell-size': `${CELL_SIZE}px`, '--cell-gap': `${CELL_GAP}px` }}
        >
            <AlleyArrows
                tiles={tiles}
                tileIndexes={tileIndexes}
                gridInset={CELL_SIZE / (2 * (CELL_SIZE + CELL_GAP))}
            />
            <Dice />
            {board.map((row, rowIndex) => (
                <div key={rowIndex} className={`row row-${rowIndex}`}>
                    {row.map((cell, cellIndex) => {
                        const tileIndex = tileIndexes.pos[`${rowIndex}, ${cellIndex}`];
                        const tile = tiles[tileIndex];
                        const isSelected = tileIndex === selectedTileIndex;
                        const isMovable = movableTileIndexes.includes(tileIndex);

                        const style = buildCellStyle({ tileIndex, startPositions, tile });
                        const className = buildCellClassNames({ cell, tile, isSelected, isMovable, cellIndex });
                        const content = buildCellContent({ cell, tileIndex, pieces });

                        const handleCellClick = () => {
                            if (isMovable) {
                                onTileClick(tileIndex);
                            }
                        };

                        return (
                            <div
                                key={cellIndex}
                                style={style}
                                className={className}
                                onClick={handleCellClick}
                                data-tile-index={tileIndex ?? ''}
                                data-tile-type={tile?.name ?? ''}
                                data-movable={isMovable ? 'true' : 'false'}
                                data-alley-target={isAlleyTile(tile) ? tile.moveTo : undefined}
                                title={isAlleyTile(tile) ? 'Подворотня: переход на другую сторону угла в обе стороны' : undefined}
                            >
                                {content}
                                {isAlleyTile(tile) && <span className="alley-indicator" aria-hidden="true">⇄</span>}
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
};

export default GameBoard;
