import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import './Dice.css';
import { finishDiceRoll } from '../store/gameSlice';
import { selectDice, selectDiceRoll, selectIsRolling, selectMoves } from '../store/selectors/gameSelectors';
import { createDiceScene } from './dice/createDiceScene';
import { DICE_FACES, PIP_POSITIONS } from './dice/diceFaces';
import { DICE_ROLL_DURATION, getDiceRollDuration } from '../shared/animationTiming.js';

export { DICE_ROLL_DURATION };

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

const Dice = ({ visualTheme = 'classic' }) => {
    const dispatch = useDispatch();
    const roll = useSelector(selectDiceRoll);
    const isRolling = useSelector(selectIsRolling);
    const dice = useSelector(selectDice);
    const moves = useSelector(selectMoves);
    // Game animations run independently of the operating system's motion preference.
    const reducedMotion = false;
    const container = useRef(null);
    const scene = useRef(null);
    const [supportsWebGL, setSupportsWebGL] = useState(true);
    const duration = getDiceRollDuration(roll, reducedMotion);
    const rollId = roll?.id;
    const firstValue = roll?.values[0];
    const secondValue = roll?.values[1];
    const startedAt = roll?.startedAt;
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
        if (!rollId) { scene.current?.clear(); return; }
        const values = [firstValue, secondValue];
        if (!isRolling) { scene.current?.roll(values, rollId, 0, true); scene.current?.finish(); return; }

        const remaining = startedAt ? Math.max(1, duration - Math.max(0, Date.now() - startedAt)) : duration;
        scene.current?.roll(values, rollId, remaining, reducedMotion);
        // The clock also completes a throw in a background tab where animation frames pause.
        const timeout = window.setTimeout(() => dispatch(finishDiceRoll(rollId)), remaining);
        return () => { window.clearTimeout(timeout); scene.current?.stop(); };
    }, [dispatch, rollId, firstValue, secondValue, startedAt, isRolling, duration, reducedMotion]);

    useEffect(() => { scene.current?.updateState(dice, currentIndex, isRolling, visualTheme); }, [dice, currentIndex, isRolling, visualTheme]);

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
