import gameReducer, { movePiece, placePiece } from '../store/gameSlice.js';
import { OUTER_LAYER_TILES_COUNT } from '../store/gameBoardInit.js';
import { calculateOrdinaryMove, canPieceMove, getPieceProgress, hasPlayerFinished, isGameOver,
    isPieceAtHome, isPieceInJail, isPieceInPrison, isPieceOnOuterTrack } from '../store/logic/gameRules.js';

// Enumerate real reducer actions, including a six spent on release or deployment.
export const getBotActions = state => {
    if (state.isRolling || state.canRoll || isGameOver(state)) return [];
    const player = state.players[state.currentPlayerIndex];
    if (hasPlayerFinished(state, player.color)) return [];
    const pieces = state.pieces[player.color], actions = [];
    if (state.canPlace) {
        const index = pieces.findIndex(piece => piece.tile === null);
        if (index >= 0) actions.push(placePiece(index));
    }
    if (state.canMove) pieces.forEach((piece, index) => {
        if (canPieceMove(state, piece, player)) actions.push(movePiece({ tileIndex: piece.tile, pieceIndex: index }));
    });
    return actions;
};

const pieceValue = (state, piece, player) => {
    if (piece.tile === null) return 0;
    if (isPieceInPrison(state, piece)) return -34;
    if (isPieceAtHome(state, piece)) return 175 + state.tiles[piece.tile].position * 24;
    const progress = Math.max(0, getPieceProgress(state, piece, player) ?? 0);
    if (isPieceInJail(state, piece)) return 18 + progress * 1.3 - (4 - state.tiles[piece.tile].needToRoll) * 12;
    return 24 + progress * 1.45 + progress * progress * .015;
};

const addCaptureTiles = (tiles, destination) => {
    if (!destination) return;
    if (Number.isInteger(destination.alleyEntry)) tiles.add(destination.alleyEntry);
    if (destination.tile >= 0 && destination.tile < OUTER_LAYER_TILES_COUNT) tiles.add(destination.tile);
};

// For each of the 36 equally likely dice pairs, collect possible attacks on
// either die. Follow automatic alleys and a second move by the same token.
// This estimates exposure, rather than pretending to know a future throw.
const opponentThreats = (state, opponent) => {
    const probabilities = new Map(), pieces = state.pieces[opponent.color];
    for (let high = 1; high <= 6; high += 1) for (let low = 1; low <= high; low += 1) {
        const targets = new Set(), weight = high === low ? 1 / 36 : 2 / 36;
        for (const piece of pieces) {
            if (piece.tile === null) {
                if (high === 6) {
                    targets.add(opponent.start);
                    addCaptureTiles(targets, calculateOrdinaryMove({ state, player: opponent,
                        piece: { ...piece, tile: opponent.start, progress: 0 }, moveValue: low }));
                }
            } else if (isPieceInPrison(state, piece)) {
                if (high === 6 && low === 6) targets.add(opponent.start);
            } else if (isPieceInJail(state, piece)) {
                const jail = state.tiles[piece.tile];
                if (jail.exitTile !== undefined && (high === jail.needToRoll || low === jail.needToRoll)) targets.add(jail.exitTile);
            } else if (isPieceOnOuterTrack(piece)) {
                const first = calculateOrdinaryMove({ state, piece, player: opponent, moveValue: high });
                addCaptureTiles(targets, first);
                if (low !== high) addCaptureTiles(targets, calculateOrdinaryMove({ state, piece, player: opponent, moveValue: low }));
                if (first?.tile >= 0 && first.tile < OUTER_LAYER_TILES_COUNT) {
                    addCaptureTiles(targets, calculateOrdinaryMove({ state, player: opponent,
                        piece: { ...piece, tile: first.tile, progress: first.progress }, moveValue: low }));
                }
            }
        }
        targets.forEach(tile => probabilities.set(tile, (probabilities.get(tile) ?? 0) + weight));
    }
    return probabilities;
};

const evaluatePosition = (state, color) => {
    if (hasPlayerFinished(state, color)) return 10_000;
    if (state.loser === color) return -10_000;
    const player = state.players.find(candidate => candidate.color === color);
    const opponents = state.players.filter(candidate => candidate.color !== color && !hasPlayerFinished(state, candidate.color));
    let score = state.pieces[color].reduce((sum, piece) => sum + pieceValue(state, piece, player), 0);
    const threats = opponents.map(opponent => opponentThreats(state, opponent));
    for (const opponent of opponents) {
        score -= state.pieces[opponent.color].reduce((sum, piece) => sum + pieceValue(state, piece, opponent), 0) * .28;
    }
    for (const piece of state.pieces[color]) {
        if (!isPieceOnOuterTrack(piece)) continue;
        const survival = threats.reduce((chance, threat) => chance * (1 - (threat.get(piece.tile) ?? 0)), 1);
        // Losing a stack sends every token to prison; advanced tokens cost more.
        const exposure = (1 - survival) * (state.canRoll && state.players[state.currentPlayerIndex].color === color ? .65 : 1);
        score -= exposure * (pieceValue(state, piece, player) + 34) * .9;
    }
    return score;
};

export const chooseBotAction = state => {
    const actions = getBotActions(state);
    if (!actions.length) return null;
    const color = state.players[state.currentPlayerIndex].color;
    const bestContinuation = (position, depth) => {
        if (!depth || position.canRoll || isGameOver(position) || position.players[position.currentPlayerIndex].color !== color) {
            return evaluatePosition(position, color);
        }
        const next = getBotActions(position);
        if (!next.length) return evaluatePosition(position, color);
        return Math.max(...next.map(action => bestContinuation(gameReducer(position, action), depth - 1)));
    };
    let bestAction = actions[0], bestScore = -Infinity;
    for (const action of actions) {
        const score = bestContinuation(gameReducer(state, action), state.moves.length - 1);
        if (score > bestScore) { bestScore = score; bestAction = action; }
    }
    return bestAction;
};
