// The store keeps its original player identifiers; these are their table colours.
export const PLAYER_THEMES = {
    green: { name: 'Игрок 1', suit: '♣', suitName: 'Трефы', position: 'green', accent: '#7ea84b', light: '#bee081', dark: '#173322' },
    red: { name: 'Игрок 2', suit: '♥', suitName: 'Червы', position: 'red', accent: '#c14c42', light: '#f59a7c', dark: '#4a191b' },
    orange: { name: 'Игрок 3', suit: '♦', suitName: 'Бубны', position: 'orange', accent: '#d4a33c', light: '#ffe29a', dark: '#493312' },
    black: { name: 'Игрок 4', suit: '♠', suitName: 'Пики', position: 'black', accent: '#548faf', light: '#a7d7ec', dark: '#173243' },
};

export const playerStyle = (color) => {
    const theme = PLAYER_THEMES[color];
    return { '--player-accent': theme.accent, '--player-light': theme.light, '--player-dark': theme.dark };
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
