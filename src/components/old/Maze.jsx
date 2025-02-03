import React, { useState, useRef } from 'react';
import Circle from './Circle';
import Path from './Path';
import Overlay from './Overlay';
import './Maze.css';

const Maze = () => {
    const [isGameOver, setIsGameOver] = useState(false);
    const [hasWon, setHasWon] = useState(false);
    const [isMoving, setIsMoving] = useState(false);
    const [position, setPosition] = useState({ x: 5, y: 5 });
    const circleRef = useRef(null);

    const onMazeLeave = () => {
        if (isMoving) {
            setIsGameOver(true);
            setIsMoving(false);
        }
    };

    const resetGame = () => {
        setIsGameOver(false);
        setHasWon(false);
        setPosition({ x: 5, y: 5 });
    };

    const onMazeComplete = () => {
        if (isMoving) {
            setHasWon(true);
            setIsMoving(false);
        }
    };

    const checkCollision = () => {
        const circle = circleRef.current;
        const walls = document.querySelectorAll(".path");
        walls.forEach(wall => {
            const rect = wall.getBoundingClientRect();
            const circleRect = circle.getBoundingClientRect();
            const isColliding = (
                rect.left <= circleRect.right &&
                rect.right >= circleRect.left &&
                rect.top <= circleRect.bottom &&
                rect.bottom >= circleRect.top
            );

            if (isColliding) {
                setIsGameOver(true);
                setIsMoving(false);
            }
        });
    };

    const startMove = (e) => {
        setIsMoving(true);
    };

    const moveCircle = (e) => {
        if (!isMoving) return;
        const bounds = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - bounds.left - 10;
        const y = e.clientY - bounds.top - 10;
        setPosition({ x, y });
        if (circleRef.current) {
            checkCollision();
        }
    };

    const endMove = () => {
        setIsMoving(false);
    };

    return (
        <div>
            <div
                className="maze"
                onMouseDown={startMove}
                onMouseMove={moveCircle}
                onMouseUp={endMove}
                onMouseLeave={onMazeLeave}>

                <Circle position={position} ref={circleRef} />
                <Path />
                <div className="finish" onMouseEnter={onMazeComplete}>Финиш</div>

                {isGameOver && <Overlay message="Вы проиграли!" />}
                {hasWon && <Overlay message="Вы выиграли!" />}
            </div>

            <button onClick={resetGame}>Начать заново</button>
        </div>
    );
}

export default Maze;
