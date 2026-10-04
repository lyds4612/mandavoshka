import { getCharacter } from '../shared/characters';

// Seat identifiers stay stable while a character supplies its visible uniform colour.
export const PLAYER_THEMES = {
    green: { name: 'Игрок 1', suit: '♣', suitName: 'Трефы', position: 'green', accent: '#7ea84b', light: '#bee081', dark: '#173322' },
    red: { name: 'Игрок 2', suit: '♥', suitName: 'Червы', position: 'red', accent: '#c14c42', light: '#f59a7c', dark: '#4a191b' },
    orange: { name: 'Игрок 3', suit: '♦', suitName: 'Бубны', position: 'orange', accent: '#d4a33c', light: '#ffe29a', dark: '#493312' },
    black: { name: 'Игрок 4', suit: '♠', suitName: 'Пики', position: 'black', accent: '#548faf', light: '#a7d7ec', dark: '#173243' },
};

const UNIFORM_COLORS = { black: '#343c40', red: '#c62e2c', green: '#39934b', yellow: '#e6bd28',
    blue: '#2369d4', pink: '#d83c83', '#ee9e22': '#e86b28' };

export const getCharacterPalette = (characterId) => {
    const character = getCharacter(characterId);
    if (!character) return null;
    const accent = UNIFORM_COLORS[character.color] ?? character.color;
    return { accent, light: `color-mix(in srgb, ${accent} 55%, #fff4db)`, dark: `color-mix(in srgb, ${accent} 28%, #10181b)` };
};

export const tableStyle = (participants = []) => Object.fromEntries(participants.flatMap(player => {
    const palette = getCharacterPalette(player.characterId);
    return palette ? Object.entries(palette).map(([name, value]) => [`--seat-${player.color}-${name}`, value]) : [];
}));

export const playerStyle = (color, characterId) => {
    const theme = PLAYER_THEMES[color];
    const palette = getCharacterPalette(characterId);
    return Object.fromEntries(['accent', 'light', 'dark'].map(name => [`--player-${name}`,
        palette?.[name] ?? `var(--seat-${color}-${name}, ${theme[name]})`]));
};

export const presentTurnMessage = (message, participants = []) => message.replace(/\b(green|black|red|orange)\b/g,
    color => participants.find(player => player.color === color)?.name ?? PLAYER_THEMES[color].name.replace('Игрок', '№'));

export const summarizePieces = (pieces, tiles, prisonTileIndex) => pieces.reduce((summary, piece) => {
    if (piece.tile === null) summary.hand += 1;
    else if (piece.tile === prisonTileIndex) summary.prison += 1;
    else if (tiles[piece.tile]?.name === 'jail') summary.jail += 1;
    else if (tiles[piece.tile]?.name === 'home') summary.home += 1;
    else summary.field += 1;
    return summary;
}, { hand: 0, field: 0, jail: 0, prison: 0, home: 0 });
