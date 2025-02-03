import React from 'react';
import './Dice.css';

const Dice = ({ dice, rollDice }) => {
    return (
        <div className="controls">
            <div className="dice">
                <div className="die">{dice[0]}</div>
                <div className="die">{dice[1]}</div>
            </div>
            <button onClick={rollDice}>Roll Dice</button>
        </div>
    );
};

export default Dice;
