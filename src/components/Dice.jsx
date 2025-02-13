import React from 'react';
import './Dice.css';

const Dice = ({ dice }) => {
    return (
        <div className="controls">
            <div className="dice">
                <div className="die">{dice[0]}</div>
                <div className="die">{dice[1]}</div>
            </div>
        </div>
    );
};

export default Dice;
