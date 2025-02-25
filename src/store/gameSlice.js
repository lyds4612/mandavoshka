import {createSlice} from '@reduxjs/toolkit';
import {createInitialGameState} from "./gameBoardInit";

const createInitialPlayerState = (state, action) => {
    state.dice = [null, null];
    state.canRoll = true;
    state.canMove = false;
    state.canPlace = false;
    state.moves = []
}

const initialState = createInitialGameState();

const changePlayer = (state) => {
    state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
    state.currentPlayer = state.players[state.currentPlayerIndex];
}

const roll = () => Math.ceil(Math.random() * 6);

const recalculatePlayerState = (state) => {
    const player = state.currentPlayer;
    const pieces = state.pieces[player.color];

    const canMove = pieces.some((piece) => piece.tile !== null);
    const hasPiecesInHands = pieces.some((piece) => piece.tile === null);
    const canPlace = state.dice.includes(6) && hasPiecesInHands;
    const canRoll = state.moves.length === 0;
    state.canMove = canMove;
    state.canPlace = canPlace;
    state.canRoll = canRoll;
}

const recalculateMoves = (state) => {
    const dice = state.moves[0];
    state.moves.shift();
    state.dice[state.dice.indexOf(dice)] = null
    console.log('Dice is used:', state.dice);
    console.log('Moves:', state.moves);
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
            const player = state.players.find(player => player.color === state.currentPlayer.color)
            player.lastDice = [...dice]
            recalculatePlayerState(state);

            if (!state.canPlace && !state.canMove) {
                console.log('LOOSER!!1');
                createInitialPlayerState(state);
                changePlayer(state)
            }
        },
        placePiece(state) {
            const player = state.currentPlayer;
            const piece = state.pieces[player.color].find((piece) => piece.tile === null);
            piece.tile = player.start;

            recalculateMoves(state);
            console.log('Piece set to', piece.tile);
            recalculatePlayerState(state);
            if (state.moves.length === 0) {
                createInitialPlayerState(state);
                changePlayer(state);
            }
        },
        movePiece(state, { payload: tileIndex }) {
            const player = state.currentPlayer;
            const piece = state.pieces[player.color].find((piece) => piece.tile === tileIndex);
            if (piece) {
                let index = piece.tile + state.moves[0];
                if (state.tiles[index].name === 'jail') {
                    while(state.tiles[index].name === 'jail') {
                        index--;
                    }
                    const diff = index - piece.tile;
                    piece.tile = state.moves[0] - diff - 1;
                } else {
                    piece.tile = index;
                }


            } else {
                console.error(`Piece of ${state.currentPlayer.color} not found on ${tileIndex}`)
                return;
            }

            recalculateMoves(state);

            if (state.moves.length === 0) {
                createInitialPlayerState(state);
                changePlayer(state);
            }
        },
        resetGame() {
            return createInitialGameState();
        },
    },
});

export const { rollDice, placePiece, movePiece, resetGame } = gameSlice.actions;
export default gameSlice.reducer;
