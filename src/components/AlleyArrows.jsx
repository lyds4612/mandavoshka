import { useId } from 'react';
import { SIDE_SIZE } from '../store/gameBoardInit';
import { TILE_TYPES } from '../store/utils/tileUtils';

const insetFromTrack = ([x, y]) => [
    x === 0 ? 1 : x === SIDE_SIZE ? SIDE_SIZE : x + 0.5,
    y === 0 ? 1 : y === SIDE_SIZE ? SIDE_SIZE : y + 0.5,
];
const curvePoint = (from, control, to, t) => from.map((value, axis) =>
    (1 - t) ** 2 * value + 2 * (1 - t) * t * control[axis] + t ** 2 * to[axis],
);
// Each direction ends inside the quarter, like the printed arrows on the board.
const halfCurve = (from, control, to) => {
    const t = 0.46;
    const end = curvePoint(from, control, to, t);
    const bend = from.map((value, axis) => value + t * (control[axis] - value));
    return `M ${from.join(' ')} Q ${bend.join(' ')} ${end.join(' ')}`;
};

const AlleyArrows = ({ tiles, tileIndexes }) => {
    const prefix = `alley-${useId().replace(/:/g, '')}`;
    const pairs = tiles.filter((tile) => tile.name === TILE_TYPES.alley && tile.index < tile.moveTo);
    return (
        <svg className="alley-arrows" viewBox="0 0 13 13" role="img" aria-label="Красные и зелёные дуги подворотен соединяют две стороны каждого угла">
            <defs>
                {['red', 'green'].map((color) => (
                    <g key={color}>
                        <marker id={`${prefix}-${color}`} viewBox="0 0 12 12" refX="10" refY="6" markerWidth="5" markerHeight="5" orient="auto" className={`alley-arrow-${color}`}>
                            <path d="M 1 1 L 11 6 L 1 11 L 3 6 Z" fill="currentColor" />
                        </marker>
                        <marker id={`${prefix}-${color}-star`} viewBox="0 0 12 12" refX="6" refY="6" markerWidth="6" markerHeight="6" orient="auto" className={`alley-arrow-${color}`}>
                            <path d="M6 0L7.7 4.2L12 4.6L8.7 7.5L9.7 12L6 9.5L2.3 12L3.3 7.5L0 4.6L4.3 4.2Z" fill="currentColor" />
                        </marker>
                    </g>
                ))}
            </defs>
            {pairs.map((tile) => {
                const from = insetFromTrack(tileIndexes.index[tile.index]);
                const to = insetFromTrack(tileIndexes.index[tile.moveTo]);
                const control = [
                    from[0] === 1 || from[0] === SIDE_SIZE ? to[0] : from[0],
                    from[1] === 1 || from[1] === SIDE_SIZE ? to[1] : from[1],
                ];
                const forwardColor = tile.progressOffset > 0 ? 'green' : 'red';
                const reverseColor = tile.progressOffset > 0 ? 'red' : 'green';
                const forwardMark = from[0] === 1 || from[0] === SIDE_SIZE ? '-star' : '';
                const reverseMark = to[0] === 1 || to[0] === SIDE_SIZE ? '-star' : '';
                return (
                    <g key={tile.index} data-alley-pair={`${tile.index}-${tile.moveTo}`}>
                        <title>Подворотня: переход в обе стороны при остановке на клетке 2</title>
                        <path className={`alley-route alley-arrow-${forwardColor}`} d={halfCurve(from, control, to)} markerEnd={`url(#${prefix}-${forwardColor}${forwardMark})`} />
                        <path className={`alley-route alley-arrow-${reverseColor}`} d={halfCurve(to, control, from)} markerEnd={`url(#${prefix}-${reverseColor}${reverseMark})`} />
                    </g>
                );
            })}
        </svg>
    );
};

export default AlleyArrows;
