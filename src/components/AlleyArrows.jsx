import { useId } from 'react';
import { SIDE_SIZE } from '../store/gameBoardInit';
import { TILE_TYPES } from '../store/utils/tileUtils';

const insetFromTrack = ([x, y]) => [
    x === 0 ? 0.65 : x === SIDE_SIZE ? SIDE_SIZE - 0.65 : x,
    y === 0 ? 0.65 : y === SIDE_SIZE ? SIDE_SIZE - 0.65 : y,
];

const curvePath = (from, to, control, offset) => {
    const point = ([x, y]) => `${x + offset[0]} ${y + offset[1]}`;
    return `M ${point(from)} Q ${point(control)} ${point(to)}`;
};

const AlleyArrows = ({ tiles, tileIndexes, gridInset }) => {
    const markerPrefix = `alley-${useId().replace(/:/g, '')}`;
    const pairs = tiles.filter((tile) => tile.name === TILE_TYPES.alley && tile.index < tile.moveTo);
    const boardSize = SIDE_SIZE + gridInset * 2;

    return (
        <svg
            className="alley-arrows"
            viewBox={`${-gridInset} ${-gridInset} ${boardSize} ${boardSize}`}
            role="img"
            aria-label="Подворотни: красные и зелёные стрелки соединяют клетки у каждого угла в обе стороны"
        >
            <defs>
                {['red', 'green'].map((color) => (
                    <marker
                        key={color}
                        id={`${markerPrefix}-${color}`}
                        viewBox="0 0 10 10"
                        refX="8"
                        refY="5"
                        markerWidth="4"
                        markerHeight="4"
                        orient="auto"
                        className={`alley-arrow-${color}`}
                    >
                        <path d="M 0 0 L 10 5 L 0 10 Z" fill="currentColor" />
                    </marker>
                ))}
            </defs>
            {pairs.map((tile) => {
                const from = insetFromTrack(tileIndexes.index[tile.index]);
                const to = insetFromTrack(tileIndexes.index[tile.moveTo]);
                const control = [
                    (from[0] + to[0]) / 2 < SIDE_SIZE / 2 ? 2.8 : SIDE_SIZE - 2.8,
                    (from[1] + to[1]) / 2 < SIDE_SIZE / 2 ? 2.8 : SIDE_SIZE - 2.8,
                ];
                const length = Math.hypot(to[0] - from[0], to[1] - from[1]);
                const offset = [(to[1] - from[1]) / length * 0.1, (from[0] - to[0]) / length * 0.1];
                const forwardColor = tile.progressOffset > 0 ? 'green' : 'red';
                const reverseColor = tile.progressOffset > 0 ? 'red' : 'green';

                return (
                    <g key={tile.index} data-alley-pair={`${tile.index}-${tile.moveTo}`}>
                        <title>Подворотня: переход между двумя сторонами угла</title>
                        <path
                            className={`alley-route alley-arrow-${forwardColor}`}
                            d={curvePath(from, to, control, offset)}
                            markerEnd={`url(#${markerPrefix}-${forwardColor})`}
                        />
                        <path
                            className={`alley-route alley-arrow-${reverseColor}`}
                            d={curvePath(to, from, control, offset.map((value) => -value))}
                            markerEnd={`url(#${markerPrefix}-${reverseColor})`}
                        />
                    </g>
                );
            })}
        </svg>
    );
};

export default AlleyArrows;
