import {createSlice} from '@reduxjs/toolkit';
import {createInitialGameState} from "./gameBoardInit";

const createInitialPlayerState = (state, action) => {
    state.dice = [null, null];
    state.canRoll = true;
    state.canMove = false;
    state.canPlace = false;
    state.moves = [];
}


const initialState = createInitialGameState();

const changePlayer = (state) => {
    state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
    state.currentPlayer = state.players[state.currentPlayerIndex];
}

const roll = () => Math.ceil(Math.random() * 6);

const recalculatePlayerState = (state) => {
    const player = state.currentPlayer;

    const canMove = player.pieces.some((piece) => piece.tile !== null);
    const hasPiecesInHands = player.pieces.some((piece) => piece.tile === null);
    const canPlace = state.dice.includes(6) && hasPiecesInHands;
    const canRoll = state.moves && state.moves.length > 0;
    state.canMove = canMove;
    state.canPlace = canPlace;
    state.canRoll = canRoll;
}

const gameSlice = createSlice({
    name: 'game',
    initialState,
    reducers: {
        rollDice(state) {
            const dice = [roll(), roll()];
            const moves = [...dice].sort((a, b) => b - a);
            console.log('Dice:', dice.join(', '));
            state.moves = moves;
            state.dice = dice;

            recalculatePlayerState(state);

            if (!state.canPlace && !state.canMove) {
                console.log('LOOSER!!1');
                createInitialPlayerState(state);
                changePlayer(state)
            }
        },
        placePiece(state) {
            const player = state.currentPlayer;
            const pieceIndex = player.pieces.findIndex((piece) => piece.tile === null);

            if (state.moves.length === 0) {
                console.error('BUG: Player should have moves, but nothing is here', player);
                createInitialPlayerState(state);
                changePlayer(state);
                return;
            }

            if (!state.dice.includes(6)) {
                console.error('BUG: No 6 on dice ???', player);
                createInitialPlayerState(state);
                changePlayer(state);
                return;
            }
            if (pieceIndex === -1) {
                console.error('BUG: No piece available to place', player);
                createInitialPlayerState(state);
                changePlayer(state);
                return;
            }
            const piece = player.pieces[pieceIndex];
            const startTile = state.tiles[player.start];
            piece.tile = startTile.index;
            startTile.pieces.push(piece);

            const dice = state.moves[0];
            state.moves.shift();
            state.dice[state.dice.indexOf(dice)] = null
            console.log('Dice is used', dice);
            console.log('Piece set to', piece.tile);
            recalculatePlayerState(state);
            if (state.moves.length === 0) {
                createInitialPlayerState(state);
                changePlayer(state);
            }
        },
        movePiece(state, action) {
            const { dice, pieceIndex } = action.payload;
            const player = state.currentPlayer;
            const piece = player.pieces[pieceIndex];
            if (!piece) return;

            if (piece.tile !== null) {
                const currentTile = state.tiles[piece.tile];
                currentTile.pieces = currentTile.pieces.filter((p) => p !== piece);

                const nextPlace = piece.tile + dice;
                piece.tile = nextPlace;

                const nextTile = state.tiles[nextPlace];
                if (nextTile) {
                    nextTile.pieces.push(piece);
                } else {
                    console.error('Next tile does not exist for index', nextPlace);
                }
            } else {
                const startTile = state.tiles[player.start];
                piece.tile = startTile.index;
                startTile.pieces.push(piece);
            }
        },
        resetGame() {
            return createInitialGameState();
        },
    },
});

export const { rollDice, placePiece, movePiece, resetGame } = gameSlice.actions;
export default gameSlice.reducer;
