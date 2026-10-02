import { createInitialPlayerState } from '../gameBoardInit';
import {
    calculatePlayerActionFlags,
    shouldSkipTurnAfterRoll,
    shouldEndTurnAfterPlacement,
    shouldEndTurnAfterMovement,
} from '../utils/playerStateUtils';

const setActionFlags = (state, flags) => {
    state.canMove = flags.canMove;
    state.canPlace = flags.canPlace;
    state.canRoll = flags.canRoll;
};

export const changePlayer = (state) => {
    state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
    state.currentPlayer = state.players[state.currentPlayerIndex];
};

export const consumeCurrentMove = (state, forceConsume) => {
    const moveValue = state.moves[0];
    if (forceConsume) {
        const forceIndex = state.moves.indexOf(forceConsume);
        if (forceIndex === -1) {
            console.error('Trying to force consume move that does not exist:', forceConsume);
            return;
        }   
        state.moves.splice(forceIndex, 1);
        state.dice[state.dice.indexOf(forceIndex)] = null;
    } else {
        state.moves.shift();
        state.dice[state.dice.indexOf(moveValue)] = null;
    }
};

export const recalculateCurrentPlayerFlags = (state, player) => {
    const actionFlags = calculatePlayerActionFlags({
        pieces: state.pieces[player.color],
        dice: state.dice,
        moves: state.moves,
        lastDice: player.lastDice,
    });

    setActionFlags(state, actionFlags);
    return actionFlags;
};

export const resetTurnAndChangePlayer = (state) => {
    createInitialPlayerState(state);
    changePlayer(state);
};

export const handlePostRollTurnState = (state, player) => {
    const actionFlags = recalculateCurrentPlayerFlags(state, player);
    if (shouldSkipTurnAfterRoll(actionFlags)) {
        resetTurnAndChangePlayer(state);
    }
};

export const handlePostPlacementTurnState = (state, player) => {
    recalculateCurrentPlayerFlags(state, player);
    if (shouldEndTurnAfterPlacement(state)) {
        resetTurnAndChangePlayer(state);
    }
};

export const handlePostMovementTurnState = (state) => {
    if (shouldEndTurnAfterMovement(state)) {
        resetTurnAndChangePlayer(state);
    }
};
