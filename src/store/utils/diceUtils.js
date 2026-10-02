export const roll = () => Math.ceil(Math.random() * 6);

export const rollDice = () => [roll(), roll()];

export const createMoveQueue = (dice) => [...dice].sort((a, b) => b - a);
