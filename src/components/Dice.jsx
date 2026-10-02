import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import './Dice.css';
import { finishDiceRoll } from '../store/gameSlice';
import { selectDice, selectDiceRoll, selectIsRolling, selectMoves } from '../store/selectors/gameSelectors';
import { createDiceScene } from './dice/createDiceScene';
import { DICE_FACES, PIP_POSITIONS } from './dice/diceFaces';

export const DICE_ROLL_DURATION = 1400;
const REPEAT_ROLL_DURATION = 1100;

const useReducedMotion = () => {
    const [reduced, setReduced] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
    useEffect(() => {
        const preference = window.matchMedia?.('(prefers-reduced-motion: reduce)');
        if (!preference) return;
        const update = () => setReduced(preference.matches);
        preference.addEventListener('change', update);
        return () => preference.removeEventListener('change', update);
    }, []);
    return reduced;
};

const FALLBACK_ROTATIONS = { 1: [90, 0], 2: [0, 0], 3: [0, -90], 4: [0, 90], 5: [180, 0], 6: [-90, 0] };

const FallbackDice = ({ roll, isRolling, availableDice, currentIndex, duration, reducedMotion }) => (
    <div className={`fallback-dice ${isRolling && !reducedMotion ? 'is-rolling' : ''}`} aria-hidden="true">
        {roll.values.map((value, index) => (
            <div
                key={`${roll.id}-${index}`}
                className={`fallback-die ${!isRolling && availableDice[index] === null ? 'is-used' : ''} ${index === currentIndex ? 'is-current' : ''}`}
                style={{ '--die-index': index, '--roll-duration': `${duration}ms`, '--result-x': `${FALLBACK_ROTATIONS[value][0]}deg`, '--result-z': `${FALLBACK_ROTATIONS[value][1]}deg` }}
            >
                <div className="fallback-die-shadow" />
                <div className="fallback-die-flight">
                    <div className="fallback-die-camera">
                        <div className="fallback-die-cube">
                            {DICE_FACES.map(({ value: faceValue, name }) => (
                                <div key={name} className={`fallback-die-face face-${name}`}>
                                    {PIP_POSITIONS[faceValue].map(([x, y]) => (
                                        <span key={`${x}-${y}`} className="fallback-pip" style={{ left: `${50 + x * 27}%`, top: `${50 + y * 27}%` }} />
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        ))}
    </div>
);

export const DiceResult = () => {
    const roll = useSelector(selectDiceRoll);
    const isRolling = useSelector(selectIsRolling);
    const dice = useSelector(selectDice);
    const moves = useSelector(selectMoves);
    const currentIndex = dice.indexOf(moves[0]);

    return (
        <div className="dice-result" role="status" aria-live="polite" aria-atomic="true">
            {isRolling ? <span className="dice-flight-status">Кубики летят на доску…</span> : roll ? (
                <>
                    <span className="dice-result-label">Бросок {roll.playerColor}:</span>
                    {roll.values.map((value, index) => (
                        <span
                            key={index}
                            className={`dice-value ${dice[index] === null ? 'is-used' : ''} ${index === currentIndex ? 'is-current' : ''}`}
                            aria-label={`Кубик ${index + 1}: ${value}${dice[index] === null ? ', использован' : index === currentIndex ? ', следующий ход' : ''}`}
                        >
                            {value}{dice[index] === null && <span aria-hidden="true"> ✓</span>}
                        </span>
                    ))}
                </>
            ) : <span className="dice-result-label">Кубики падают прямо на поле</span>}
        </div>
    );
};

const Dice = () => {
    const dispatch = useDispatch();
    const roll = useSelector(selectDiceRoll);
    const isRolling = useSelector(selectIsRolling);
    const dice = useSelector(selectDice);
    const moves = useSelector(selectMoves);
    const reducedMotion = useReducedMotion();
    const container = useRef(null);
    const scene = useRef(null);
    const [supportsWebGL, setSupportsWebGL] = useState(true);
    const duration = reducedMotion ? 180 : roll?.sequence > 3 ? REPEAT_ROLL_DURATION : DICE_ROLL_DURATION;
    const currentIndex = dice.indexOf(moves[0]);

    useEffect(() => {
        try {
            scene.current = createDiceScene(container.current, () => setSupportsWebGL(false));
        } catch {
            setSupportsWebGL(false);
        }
        return () => { scene.current?.dispose(); scene.current = null; };
    }, []);

    useEffect(() => {
        if (!roll) { scene.current?.clear(); return; }
        if (!isRolling) { scene.current?.finish(); return; }

        scene.current?.roll(roll.values, roll.id, duration, reducedMotion);
        // The clock also completes a throw in a background tab where animation frames pause.
        const timeout = window.setTimeout(() => dispatch(finishDiceRoll(roll.id)), duration);
        return () => { window.clearTimeout(timeout); scene.current?.stop(); };
    }, [dispatch, roll, isRolling, duration, reducedMotion]);

    useEffect(() => { scene.current?.updateState(dice, currentIndex, isRolling); }, [dice, currentIndex, isRolling]);

    return (
        <div
            className="dice-stage"
            data-dice-state={isRolling ? 'rolling' : roll ? 'settled' : 'idle'}
            data-dice-renderer={supportsWebGL ? 'webgl' : 'css-3d'}
            data-roll-id={roll?.id ?? ''}
            data-roll-values={roll?.values.join(',') ?? ''}
            role="img"
            aria-hidden={!roll}
            aria-label={isRolling ? 'Два объёмных кубика падают на доску' : `На доске кубики: ${roll?.values.join(' и ') ?? ''}`}
        >
            <div className="dice-canvas" ref={container} />
            {!supportsWebGL && roll && <FallbackDice roll={roll} isRolling={isRolling} availableDice={dice} currentIndex={currentIndex} duration={duration} reducedMotion={reducedMotion} />}
        </div>
    );
};

export default Dice;
