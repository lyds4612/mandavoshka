export const roll = () => Math.floor(Math.random() * 6) + 1;

export const rollDice = () => [roll(), roll()];

export const createMoveQueue = (dice) => [...dice].sort((a, b) => b - a);
