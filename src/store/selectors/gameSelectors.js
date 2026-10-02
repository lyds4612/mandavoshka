import { createSelector } from '@reduxjs/toolkit';

export const selectGameState = (state) => state.game;
export const selectTileIndexes = (state) => state.game.tileIndexes;
export const selectTiles = (state) => state.game.tiles;
export const selectPlayers = (state) => state.game.players;
export const selectPieces = (state) => state.game.pieces;
export const selectDice = (state) => state.game.dice;
export const selectMoves = (state) => state.game.moves;
export const selectCurrentPlayer = (state) => state.game.currentPlayer;

export const selectCurrentPlayerColor = createSelector(
    [selectCurrentPlayer],
    (currentPlayer) => currentPlayer.color
);

export const selectCurrentPlayerPieces = createSelector(
    [selectPieces, selectCurrentPlayerColor],
    (pieces, currentPlayerColor) => pieces[currentPlayerColor]
);

export const selectActionFlags = createSelector(
    [selectGameState],
    (game) => ({
        canRoll: game.canRoll,
        canMove: game.canMove,
        canPlace: game.canPlace,
    })
);
