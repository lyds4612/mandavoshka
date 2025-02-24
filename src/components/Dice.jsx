import React from 'react';
import './Dice.css';
import {useSelector} from "react-redux";

const Dice = () => {
    const dice = useSelector((state) => state.game.dice);
    const moves = useSelector((state) => state.game.moves);

    const bestMove = moves[0];
    const bestMoveIndex = dice.indexOf(bestMove);

    const dies = dice.map((die, idx) => {
        const classNames = ['die'];

        if (bestMoveIndex === idx) {
            classNames.push('current');
        }
        const className = classNames.join(' ')

        return <div key={idx} className={className}>{die}</div>
    })

    return (
        <div className="controls">
            <div className="dice">
                {dies}
            </div>
        </div>
    );
};

export default Dice;
