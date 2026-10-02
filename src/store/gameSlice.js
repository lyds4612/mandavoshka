import { createSlice, nanoid } from '@reduxjs/toolkit';

import { createInitialGameState, OUTER_LAYER_TILES_COUNT } from './gameBoardInit.js';
import {
    calculateOrdinaryMove,
    getPieceProgress,
    getRequiredMoveForPiece,
    isPieceInJail,
    isPieceInPrison,
    isWinningPosition,
} from './logic/gameRules.js';
import { consumeMoveValue, settleTurnState } from './logic/turnLogic.js';
import { rollDice as rollPairDice, createMoveQueue } from './utils/diceUtils.js';
import { findPlayerPieceOnTile, moveCapturedOpponentsToPrison } from './utils/pieceUtils.js';

const initialState = createInitialGameState();

const currentPlayer = (state) => state.players[state.currentPlayerIndex];

const captureOpponentsAt = (state, player, targetTile) => {
    if (!Number.isInteger(targetTile) || targetTile < 0 || targetTile >= OUTER_LAYER_TILES_COUNT) {
        return;
    }

    moveCapturedOpponentsToPrison({
        pieces: state.pieces,
        currentPlayerColor: player.color,
        targetTile,
        prisonTileIndex: state.prisonTileIndex,
    });
};

const updateWinner = (state, player) => {
    if (isWinningPosition(state, player)) {
        state.winner = player.color;
    }
};

const movePrisonPiece = (state, player, piece) => {
    const availableSixes = state.moves.filter((move) => move === 6).length;

    if (availableSixes >= 2) {
        consumeMoveValue(state, 6);
        consumeMoveValue(state, 6);
        piece.tile = player.start;
        piece.progress = 0;
        captureOpponentsAt(state, player, player.start);
        state.turnMessage = 'Фишка вышла из тюрьмы прямо на старт.';
        return;
    }

    consumeMoveValue(state, 6);
    piece.tile = null;
    piece.progress = null;
    state.turnMessage = 'Фишка возвращена из тюрьмы в руку.';
};

const moveJailPiece = (state, player, piece) => {
    const jailTile = state.tiles[piece.tile];
    consumeMoveValue(state, jailTile.needToRoll);
    state.sizoMoveUsed = true;

    if (jailTile.nextTile !== undefined) {
        piece.tile = jailTile.nextTile;
        state.turnMessage = `СИЗО: пройдена камера ${jailTile.needToRoll}.`;
        return;
    }

    const currentProgress = Number.isInteger(piece.progress)
        ? piece.progress
        : (jailTile.entryTile - player.start + OUTER_LAYER_TILES_COUNT) % OUTER_LAYER_TILES_COUNT;
    const exitDistance =
        (jailTile.exitTile - jailTile.entryTile + OUTER_LAYER_TILES_COUNT) % OUTER_LAYER_TILES_COUNT;

    piece.tile = jailTile.exitTile;
    piece.progress = currentProgress + exitDistance;
    captureOpponentsAt(state, player, piece.tile);
    state.turnMessage = 'Фишка вышла из СИЗО.';
};

const moveOrdinaryPiece = (state, player, piece, moveValue) => {
    const destination = calculateOrdinaryMove({ state, piece, player, moveValue });
    if (!destination) {
        return false;
    }

    consumeMoveValue(state, moveValue);
    piece.tile = destination.tile;
    piece.progress = destination.progress;
    captureOpponentsAt(state, player, destination.tile);
    state.turnMessage = Number.isInteger(destination.alleyEntry)
        ? 'Подворотня: фишка перешла на другую сторону угла.'
        : `Фишка передвинута на ${moveValue}.`;
    return true;
};

const gameSlice = createSlice({
    name: 'game',
    initialState,
    reducers: {
        receiveRemoteState(state, { payload }) {
            return payload;
        },
        rollDice: {
            prepare: () => ({ payload: { id: nanoid(), values: rollPairDice() } }),
            reducer(state, { payload }) {
                if (!state.canRoll || state.isRolling || state.winner) {
                    return;
                }

                state.rollCount += 1;
                state.diceRoll = { ...payload, playerColor: currentPlayer(state).color, sequence: state.rollCount };
                state.isRolling = true;
                state.dice = [null, null];
                state.moves = [];
                state.canRoll = false;
                state.canMove = false;
                state.canPlace = false;
                state.turnMessage = 'Кубики летят на доску…';
            },
        },

        finishDiceRoll(state, { payload: rollId }) {
            if (!state.isRolling || state.diceRoll?.id !== rollId || state.winner) {
                return;
            }

            const dice = state.diceRoll.values;
            state.isRolling = false;
            state.dice = [...dice];
            state.moves = createMoveQueue(dice);
            state.bonusRollPending = dice[0] === dice[1];
            state.turnMessage = `Выпало ${dice[0]} и ${dice[1]}.`;
            currentPlayer(state).lastDice = [...dice];
            settleTurnState(state);
        },

        placePiece(state, { payload: pieceIndex }) {
            if (!state.canPlace || state.winner) {
                return;
            }

            const player = currentPlayer(state);
            const piece = pieceIndex === undefined ? state.pieces[player.color].find((candidate) => candidate.tile === null)
                : Number.isInteger(pieceIndex) ? state.pieces[player.color][pieceIndex] : null;
            if (!piece || piece.tile !== null || !consumeMoveValue(state, 6)) {
                return;
            }

            piece.tile = player.start;
            piece.progress = 0;
            captureOpponentsAt(state, player, player.start);
            state.turnMessage = 'Новая фишка поставлена на старт.';
            settleTurnState(state);
        },

        movePiece(state, { payload }) {
            const { tileIndex, pieceIndex } = typeof payload === 'object' && payload !== null ? payload : { tileIndex: payload };
            if (!state.canMove || state.winner) {
                return;
            }

            const player = currentPlayer(state);
            const piece = findPlayerPieceOnTile({
                pieces: state.pieces,
                playerColor: player.color,
                tileIndex,
                pieceIndex,
            });
            const requiredMove = piece ? getRequiredMoveForPiece(state, piece, player) : null;

            if (!piece || requiredMove === null) {
                state.turnMessage = 'Этой фишкой сейчас ходить нельзя.';
                return;
            }

            if (isPieceInPrison(state, piece)) {
                movePrisonPiece(state, player, piece);
            } else if (isPieceInJail(state, piece)) {
                moveJailPiece(state, player, piece);
            } else {
                piece.progress = getPieceProgress(state, piece, player);
                moveOrdinaryPiece(state, player, piece, requiredMove);
            }

            updateWinner(state, player);
            settleTurnState(state);
        },

        resetGame() {
            return createInitialGameState();
        },
    },
});

export const { rollDice, finishDiceRoll, placePiece, movePiece, resetGame, receiveRemoteState } = gameSlice.actions;
export default gameSlice.reducer;
