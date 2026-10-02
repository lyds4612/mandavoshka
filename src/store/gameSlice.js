import {createSlice} from '@reduxjs/toolkit';
import {createInitialGameState} from "./gameBoardInit";
import { rollDice as rollPairDice, createMoveQueue } from './utils/diceUtils';
import {
    consumeCurrentMove,
    handlePostRollTurnState,
    handlePostPlacementTurnState,
    handlePostMovementTurnState,
    recalculateCurrentPlayerFlags,
} from './logic/turnLogic';
import { findPlayerPieceOnTile, moveCapturedOpponentsToPrison } from './utils/pieceUtils';
import { calculateDestinationTile, isPrisonTile, TILE_TYPES } from './utils/tileUtils';
import { hasSixInDice } from './utils/playerStateUtils';
const initialState = createInitialGameState();

const gameSlice = createSlice({
    name: 'game',
    initialState,
    reducers: {
        rollDice(state) {
            const dice = rollPairDice();
            const moves = createMoveQueue(dice);
            console.log('Dice:', dice.join(', '));
            state.moves = moves;
            state.dice = dice;
            const player = state.players.find(player => player.color === state.currentPlayer.color)
            player.lastDice = [...dice]
            handlePostRollTurnState(state, player);
        },
        placePiece(state) {
            const player = state.currentPlayer;
            const piece = state.pieces[player.color].find((piece) => piece.tile === null);
            if (!piece) {
                return;
            }

            piece.tile = player.start;

             if (state.prisonTileIndex !== undefined && player.start !== undefined) {
                moveCapturedOpponentsToPrison({
                    pieces: state.pieces,
                    currentPlayerColor: player.color,
                    targetTile: player.start,
                    prisonTileIndex: state.prisonTileIndex,
                });
            }

            consumeCurrentMove(state);
            console.log('Piece set to', piece.tile);
            handlePostPlacementTurnState(state, player);
        },
        movePiece(state, { payload: tileIndex }) {
            const player = state.currentPlayer;
            const piece = findPlayerPieceOnTile({
                pieces: state.pieces,
                playerColor: player.color,
                tileIndex,
            });

            if (!piece) {
                console.error(`Piece of ${state.currentPlayer.color} not found on ${tileIndex}`)
                return;
            }

            const moveValue = state.moves[0];
            
           const destinationIndex = calculateDestinationTile({
                tiles: state.tiles,
                fromTile: piece.tile,
                moveValue,
            });

            if (isPrisonTile(piece.tile)) {
                if (hasSixInDice(player.dice)) {
                    //todo забрать фишку из тюрьмы в руку
                    piece.tile = null;
                    consumeCurrentMove(state);
                    recalculateCurrentPlayerFlags(state, player);
                    return;
                }
            }
            
            if (state.tiles[tileIndex].name === TILE_TYPES.jail) {
                const {needToRoll} = state.tiles[tileIndex];
                if (state.moves[0] === needToRoll) {
                    console.log('Moving in jail from', tileIndex, 'to', tileIndex + 1);
                    piece.tile = tileIndex + 1;
                    
                    consumeCurrentMove(state, needToRoll);
                }
                recalculateCurrentPlayerFlags(state, player);
                handlePostMovementTurnState(state);
                console.error('Trying to move from jail tile without correct roll');
                return;
            }

            if (state.tiles[destinationIndex]?.name === TILE_TYPES.jailEnter) {
                console.log('Moving to jail from', tileIndex, 'to', destinationIndex);
                piece.tile = state.tiles[destinationIndex].moveTo;
                consumeCurrentMove(state);
                recalculateCurrentPlayerFlags(state, player);
                handlePostMovementTurnState(state);
                return;    
            }

            if (state.prisonTileIndex !== undefined && destinationIndex !== undefined) {
                moveCapturedOpponentsToPrison({
                    pieces: state.pieces,
                    currentPlayerColor: player.color,
                    targetTile: destinationIndex,
                    prisonTileIndex: state.prisonTileIndex,
                });
            }

            piece.tile = destinationIndex;

            consumeCurrentMove(state);
            recalculateCurrentPlayerFlags(state, player);

            if (state.moves.length === 0) {
                handlePostMovementTurnState(state);
            }
        },
        resetGame() {
            return createInitialGameState();
        },
        endTurn(state) {
            handlePostMovementTurnState(state);
        }
    },
});

export const {
    rollDice: rollDiceAction,
    placePiece,
    movePiece,
    resetGame,
    endTurn,
} = gameSlice.actions;

export { rollDiceAction as rollDice };
export default gameSlice.reducer;
