const hasPiecesOnBoard = (pieces) => pieces.some((piece) => piece.tile !== null);

const hasPiecesInHands = (pieces) => pieces.some((piece) => piece.tile === null);

export const hasSixInDice = (dice) => dice.includes(6);

const hasNoMovesLeft = (moves) => moves.length === 0;

const isDoubleRoll = (lastDice) => +lastDice[0] === +lastDice[1];


export const calculatePlayerActionFlags = ({ pieces, dice, moves, lastDice }) => {
    const canMove = hasPiecesOnBoard(pieces);
    const canPlace = hasSixInDice(dice) && hasPiecesInHands(pieces);
    const canRoll = hasNoMovesLeft(moves) || isDoubleRoll(lastDice);

    return {
        canMove,
        canPlace,
        canRoll,
    };
};

export const shouldSkipTurnAfterRoll = ({ canMove, canPlace, canRoll }) => {
    return !canMove && !canPlace && !canRoll;
};

export const shouldEndTurnAfterPlacement = ({ moves, canRoll }) => {
    return hasNoMovesLeft(moves) && !canRoll;
};

export const shouldEndTurnAfterMovement = ({ moves }) => {
    return hasNoMovesLeft(moves);
};
