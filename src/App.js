import React, {Fragment, useState} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import './App.css';
import GameBoard from './components/GameBoard';
import Dice from './components/Dice';
import {movePiece, placePiece, resetGame, rollDice} from "./store/gameSlice";

function createInitialBoard() {
    const d = '♦';
    const h = '♥';
    const c = '♣';
    const s = '♠';
    return [
        [6,     5,    4,    3,    2,    1,    0,     1,    2,    3,     4,       5,   6],
        [5,  'III', 'II',  'I',   '',   '',    1,    '',   '',   '',    '',   'III',    5],
        [4,     '',   '',   '',   '',   '',    2,    '',   '',   '',    '',    'II',    4],
        [3,     '',   '',    d,   '',   '',    3,    '',   '',    h,    '',     'I',    3],
        [2,     '',   '',   '',   '',   '',    4,    '',   '',   '',    '',      '',    2],
        [1,     '',   '',   '',   '',  '|',  '|',   '|',   '',   '',    '',      '',    1],
        [0,      1,    2,    3,    4,  '-',   '⛓️',   '-',    4,    3,     2,       1,    0],
        [1,     '',   '',   '',   '',  '|',  '|',   '|',   '',   '',    '',      '',    1],
        [2,     '',   '',   '',   '',   '',    4,    '',   '',   '',    '',      '',    2],
        [3,    'I',   '',    c,   '',   '',    3,    '',   '',    s,    '',      '',    3],
        [4,   'II',   '',   '',   '',   '',    2,    '',   '',   '',    '',      '',    4],
        [5,  'III',   '',   '',   '',   '',    1,    '',   '',   'I',  'II',  'III',    5],
        [6,     5,    4,    3,    2,    1,    0,     1,    2,     3,     4,      5,   6],
    ];
}


const App = () => {
    const dispatch = useDispatch();
    const tileIndexes  = useSelector((state) => state.game.tileIndexes)
    const tiles = useSelector((state) => state.game.tiles);
    const color = useSelector((state) => state.game.currentPlayer.color);
    const pieces = useSelector((state) => state.game.pieces);
    const canRoll = useSelector((state) => state.game.canRoll);
    const canMove = useSelector((state) => state.game.canMove);
    const canPlace = useSelector((state) => state.game.canPlace);
    const moves = useSelector((state) => state.game.moves);
    const players = useSelector((state) => state.game.players);

    const [selectedTile, setSelectedTile] = useState(null);
    const board = createInitialBoard();

    function selectTile(rowIndex, cellIndex) {
        const tileIndex = tileIndexes.pos[`${rowIndex}, ${cellIndex}`];
        console.log('Tile clicked at:', rowIndex, cellIndex, 'index:', tileIndex);
        if (tileIndex === -1) {
            console.error(`Tile not found with index: ${tileIndex}`);
            return;
        }

        const tile = tiles[tileIndex];
        setSelectedTile(tile);
    }

    const handleRollDice = () => {
        dispatch(rollDice());
    };

    const handlePlacePiece = () => {
        dispatch(placePiece());
    };

    const handleMovePiece = () => {
        console.log(selectedTile);
        dispatch(movePiece(selectedTile.index));
    };

    const Pieces = pieces[color].map((piece, index) => (
        <div key={index} className="piece" style={{ backgroundColor: piece.color }}/>
    ));

    return (
        <div className="App">
            <div>
                <div>
                    <h1>ПОД ШКОНКУ, МАНДАВОШКА!</h1>
                    <ResetGame/>
                </div>
                <GameBoard board={board} onTileClick={selectTile}/>
            </div>

            <div className="current-player">
                <Dice/>
                <button disabled={!canRoll} onClick={handleRollDice}>БРОСАЙ КУБИК</button>
                <div>
                    ТЕКУЩИЙ ИГРОК: <span style={{color}}>{color}</span>
                </div>
                <div>Ходов: {moves.length}</div>
                <div className="remaining-pieces">{Pieces}</div>
                <div>
                    <button disabled={!canPlace} onClick={handlePlacePiece}>ПОСТАВИТЬ ФИГУРУ</button>
                    <button disabled={!selectedTile || !canMove} onClick={handleMovePiece}>ПЕРЕДВИНУТЬ ФИГУРУ</button>
                </div>
            </div>
            <div className='players-on-board'>
                <div className='player'>
                    <div className="what-a-player"> Игрок:</div>
                    <div className="pieces" style={{alignItems: 'center', paddingBottom: '6px'}}>Количество фишек:</div>
                    <div className="last-move" style={{paddingTop: '5px'}}>Последний ход:</div>
                </div>
                {players.map((player)=> {
                    return (
                            <div className="player" style={{color: player.color}}> игрок: {player.color}
                                <div className="pieces">
                                    {pieces[player.color].map((piece) => {
                                        if (piece.tile !== null) {
                                            return null
                                        }
                                        return <div className="piece" style={{backgroundColor: player.color}}></div>
                                    })}
                                </div>
                                <div className="last-dice">{player?.lastDice?.join(' : ')}</div>
                            </div>
                    )
                })}
            </div>
        </div>
    );
};

const ResetGame = () => {
    const dispatch = useDispatch();

    const onClick = () => {
        dispatch(resetGame());
    }
    return <button onClick={onClick}>
        Reset
    </button>
}

export default App;
