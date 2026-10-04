import { calculateActionFlags, hasPlayerFinished, isGameOver } from './gameRules.js';

const setActionFlags = (state, flags) => {
    state.canMove = flags.canMove;
    state.canPlace = flags.canPlace;
};

const clearRolledValues = (state) => {
    state.dice = [null, null];
    state.moves = [];
};

export const changePlayer = (state) => {
    for (let step = 1; step <= state.players.length; step += 1) {
        const nextIndex = (state.currentPlayerIndex + step) % state.players.length;
        if (!hasPlayerFinished(state, state.players[nextIndex].color)) {
            state.currentPlayerIndex = nextIndex;
            return;
        }
    }
};

export const consumeMoveValue = (state, moveValue) => {
    const moveIndex = state.moves.indexOf(moveValue);
    if (moveIndex === -1) {
        return false;
    }

    state.moves.splice(moveIndex, 1);

    const dieIndex = state.dice.indexOf(moveValue);
    if (dieIndex !== -1) {
        state.dice[dieIndex] = null;
    }

    return true;
};

const blockFinishedGame = (state) => {
    clearRolledValues(state);
    state.bonusRollPending = false;
    state.canRoll = false;
    state.canMove = false;
    state.canPlace = false;
    state.isRolling = false;
    state.turnMessage = `Партия завершена. Победители: ${state.winners.join(', ')}. Не успел игрок ${state.loser}.`;
};

const prepareExtraRoll = (state) => {
    clearRolledValues(state);
    state.bonusRollPending = false;
    state.canRoll = true;
    state.canMove = false;
    state.canPlace = false;
    state.turnMessage = 'Дубль: бросьте кубики ещё раз.';
};

const finishTurn = (state) => {
    clearRolledValues(state);
    state.bonusRollPending = false;
    state.pieces[state.players[state.currentPlayerIndex].color].forEach(piece => { piece.sizoMoveUsed = false; });
    changePlayer(state);
    state.canRoll = true;
    state.canMove = false;
    state.canPlace = false;
    const player = state.players[state.currentPlayerIndex];
    state.turnMessage = `Ход игрока ${player.color}. Бросьте кубики.`;
};

export const settleTurnState = (state) => {
    if (isGameOver(state)) {
        blockFinishedGame(state);
        return;
    }

    const player = state.players[state.currentPlayerIndex];
    if (hasPlayerFinished(state, player.color)) {
        finishTurn(state);
        state.turnMessage = `Игрок ${player.color} заполнил хату и победил. ${state.turnMessage}`;
        return;
    }

    let actionFlags = calculateActionFlags(state);

    // Values are resolved from largest to smallest. If the current largest
    // value cannot be used by any legal action, discard it and try the next.
    while (!actionFlags.canMove && !actionFlags.canPlace && state.moves.length > 0) {
        consumeMoveValue(state, state.moves[0]);
        actionFlags = calculateActionFlags(state);
    }

    if (actionFlags.canMove || actionFlags.canPlace) {
        setActionFlags(state, actionFlags);
        state.canRoll = false;
        state.turnMessage = `${state.turnMessage} Выберите допустимое действие.`;
        return;
    }

    if (state.bonusRollPending) {
        prepareExtraRoll(state);
        return;
    }

    finishTurn(state);
};
