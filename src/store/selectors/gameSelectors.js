import { createSelector } from '@reduxjs/toolkit';
import { canPieceMove } from '../logic/gameRules';

export const selectGameState = (state) => state.game;
export const selectTileIndexes = (state) => state.game.tileIndexes;
export const selectTiles = (state) => state.game.tiles;
export const selectPlayers = (state) => state.game.players;
export const selectPieces = (state) => state.game.pieces;
export const selectDice = (state) => state.game.dice;
export const selectMoves = (state) => state.game.moves;
export const selectCurrentPlayer = (state) => state.game.players[state.game.currentPlayerIndex];
export const selectWinner = (state) => state.game.winner;
export const selectTurnMessage = (state) => state.game.turnMessage;

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

export const selectMovableTileIndexes = createSelector(
    [selectGameState, selectCurrentPlayer],
    (game, currentPlayer) => game.pieces[currentPlayer.color]
        .filter((piece) => canPieceMove(game, piece, currentPlayer))
        .map((piece) => piece.tile)
        .filter((tileIndex, index, tileIndexes) => tileIndexes.indexOf(tileIndex) === index),
);
