import { useId } from 'react';

const QUARTERS = [
    { x: 100, y: 100, color: 'green', suit: '♣', symbolX: 440, symbolY: 525, label: 'Трефы' },
    { x: 700, y: 100, color: 'red', suit: '♥', symbolX: 845, symbolY: 525, label: 'Червы' },
    { x: 100, y: 700, color: 'orange', suit: '♦', symbolX: 435, symbolY: 885, label: 'Бубны' },
    { x: 700, y: 700, color: 'black', suit: '♠', symbolX: 845, symbolY: 895, label: 'Пики' },
];

const BoardArtwork = ({ theme = 'classic', activeColors }) => {
    const prefix = `board-${useId().replace(/:/g, '')}`;
    const prison = theme === 'prison';
    const colors = prison
        ? { green: ['#bac4b0', '#889582'], red: ['#c8b0a2', '#aa8c7e'], orange: ['#cebf98', '#ac9b72'], black: ['#b1c1c8', '#829eac'] }
        : { green: ['#ced1a0', '#a7b17d'], red: ['#e9b8a4', '#cf9a84'], orange: ['#f4d89e', '#d8b677'], black: ['#bdd0d2', '#94b1ba'] };
    return (
        <svg className="board-artwork" viewBox="0 0 1300 1300" aria-hidden="true">
            <defs>
                <radialGradient id={`${prefix}-paper`} cx="45%" cy="38%" r="75%">
                    <stop offset="0" stopColor={prison ? '#c9ceca' : '#f4e6c4'} /><stop offset=".65" stopColor={prison ? '#abb3b1' : '#e4d0a3'} /><stop offset="1" stopColor={prison ? '#747f7e' : '#b99965'} />
                </radialGradient>
                <pattern id={`${prefix}-vines`} width="230" height="230" patternUnits="userSpaceOnUse">
                    <g fill="none" stroke="#554725" strokeWidth="2.5">
                        <path d="M0 230C90 222 70 124 115 115C159 106 173 155 139 166C115 174 101 149 119 139C134 132 142 148 130 151M115 115C112 69 24 50 31 20C38-6 75 5 65 26C58 42 42 31 48 24" />
                        <path d="M115 115C158 104 208 66 198 39C190 17 163 24 169 41C173 54 184 48 180 40M115 115C65 137 31 97 45 80C60 62 85 87 69 97M115 115C102 181 203 182 197 215" />
                    </g>
                    <g fill="#554725">
                        <path d="M84 180C61 178 58 158 62 146C82 150 94 162 84 180ZM90 165C99 147 116 146 126 150C120 168 107 175 90 165ZM149 93C153 71 173 63 184 66C178 86 169 98 149 93ZM85 85C65 85 57 67 61 54C80 56 90 67 85 85Z" />
                        <circle cx="115" cy="115" r="4" />
                    </g>
                </pattern>
                {Object.entries(colors).map(([color, [light, dark]]) => (
                    <radialGradient key={color} id={`${prefix}-${color}`}>
                        <stop stopColor={`color-mix(in srgb, var(--seat-${color}-accent, ${light}) 25%, ${light})`} />
                        <stop offset="1" stopColor={`color-mix(in srgb, var(--seat-${color}-accent, ${dark}) 30%, ${dark})`} />
                    </radialGradient>
                ))}
                <pattern id={`${prefix}-scratches`} width="200" height="200" patternUnits="userSpaceOnUse">
                    <g fill="none" stroke="#273839" strokeWidth="1.5" opacity=".2">
                        <path d="M8 28L112 25M65 71L175 69M29 156L101 160M92 194L188 192M161 2L143 47M4 116L40 119M87 9L100 18M133 131L153 127" />
                        <path d="M9 198L24 146L16 129M179 34L164 78L173 100L159 116" />
                    </g>
                    <g fill="#f8f9ec" opacity=".12"><circle cx="28" cy="42" r="2" /><circle cx="156" cy="117" r="1" /><circle cx="78" cy="146" r="2" /></g>
                </pattern>
            </defs>
            <rect width="1300" height="1300" fill={`url(#${prefix}-paper)`} />
            {QUARTERS.map(({ x, y, color, suit, symbolX, symbolY }, index) => (
                <g key={color} className={`board-quarter board-quarter-${color} ${activeColors && !activeColors.includes(color) ? 'is-inactive' : ''}`}>
                    <rect x={x} y={y} width="500" height="500" fill={`url(#${prefix}-${color})`} stroke={prison ? '#505d58' : '#5b4b30'} strokeWidth="3" />
                    <rect x={x + 7} y={y + 7} width="486" height="486" fill={`url(#${prefix}-${prison ? 'scratches' : 'vines'})`} opacity={prison ? 1 : '.105'} />
                    <rect x={x + 14} y={y + 14} width="472" height="472" fill="none" stroke={prison ? '#354b49' : '#67542f'} strokeWidth="1" opacity=".2" />
                    <text className="board-suit" x={symbolX} y={symbolY} textAnchor="middle">{suit}</text>
                    {prison && <text className="prison-quarter-label" x={symbolX} y={symbolY + 40} textAnchor="middle">КАМЕРА {String(index + 1).padStart(2, '0')}</text>}
                </g>
            ))}
        </svg>
    );
};

export default BoardArtwork;
