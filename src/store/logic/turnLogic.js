import { calculateActionFlags } from './gameRules';

const setActionFlags = (state, flags) => {
    state.canMove = flags.canMove;
    state.canPlace = flags.canPlace;
};

const clearRolledValues = (state) => {
    state.dice = [null, null];
    state.moves = [];
};

export const changePlayer = (state) => {
    state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
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
    state.turnMessage = `Победил игрок ${state.winner}!`;
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
    changePlayer(state);
    state.sizoMoveUsed = false;
    state.canRoll = true;
    state.canMove = false;
    state.canPlace = false;
    const player = state.players[state.currentPlayerIndex];
    state.turnMessage = `Ход игрока ${player.color}. Бросьте кубики.`;
};

export const settleTurnState = (state) => {
    if (state.winner) {
        blockFinishedGame(state);
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
