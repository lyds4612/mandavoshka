import React from 'react';
import './Player.css';

const Player = ({ currentPlayer, placePiece, canPlacePiece }) => {
    return (
        <div className="current-player">
            <div>
                ТЕКУЩИЙ ИГРОК: <span style={{ color: currentPlayer.color }}>{currentPlayer.id}</span>
            </div>
            <div className="remaining-pieces">
                {Array.from({ length: currentPlayer.pieces }).map((_, index) => (
                    <div key={index} className="piece" style={{ backgroundColor: currentPlayer.color }}></div>
                ))}
            </div>
            {canPlacePiece && <button onClick={placePiece}>ПОСТАВИТЬ ФИГУРУ</button>}
        </div>
    );
};

export default Player;
