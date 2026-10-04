import { OUTER_LAYER_TILES_COUNT } from '../gameBoardInit.js';
import { TILE_TYPES } from '../utils/tileUtils.js';

const FIRST_HOME_PROGRESS = OUTER_LAYER_TILES_COUNT + 1;
export const LAST_HOME_PROGRESS = FIRST_HOME_PROGRESS + 3;

export const isGameOver = (state) => Boolean(state.loser);

export const hasPlayerFinished = (state, color) => state.winners?.includes(color) ?? false;

export const isPieceInHand = (piece) => piece.tile === null;

export const isPieceInPrison = (state, piece) => piece.tile === state.prisonTileIndex;

export const isPieceInJail = (state, piece) =>
    state.tiles[piece.tile]?.name === TILE_TYPES.jail;

export const isPieceAtHome = (state, piece) =>
    state.tiles[piece.tile]?.name === TILE_TYPES.home;

export const isPieceOnOuterTrack = (piece) =>
    Number.isInteger(piece.tile) && piece.tile >= 0 && piece.tile < OUTER_LAYER_TILES_COUNT;

const deriveOuterProgress = (piece, player) =>
    (piece.tile - player.start + OUTER_LAYER_TILES_COUNT) % OUTER_LAYER_TILES_COUNT;

export const getPieceProgress = (state, piece, player) => {
    if (isPieceAtHome(state, piece)) {
        return FIRST_HOME_PROGRESS + state.tiles[piece.tile].position;
    }

    if (Number.isInteger(piece.progress)) {
        return piece.progress;
    }

    if (isPieceOnOuterTrack(piece)) {
        return deriveOuterProgress(piece, player);
    }

    return null;
};

export const calculateOrdinaryMove = ({ state, piece, player, moveValue }) => {
    if (!Number.isInteger(moveValue) || moveValue < 1 || moveValue > 6) {
        return null;
    }

    if (!isPieceOnOuterTrack(piece) && !isPieceAtHome(state, piece)) {
        return null;
    }

    const currentProgress = getPieceProgress(state, piece, player);
    if (currentProgress === null) {
        return null;
    }

    const nextProgress = currentProgress + moveValue;
    if (nextProgress > LAST_HOME_PROGRESS) {
        return null;
    }

    if (nextProgress >= FIRST_HOME_PROGRESS) {
        const homeTile = player.home[nextProgress - FIRST_HOME_PROGRESS];
        if (state.pieces[player.color].some(candidate => candidate.tile === homeTile)) {
            return null;
        }
        return {
            tile: homeTile,
            progress: nextProgress,
        };
    }

    const outerTileIndex = (player.start + nextProgress) % OUTER_LAYER_TILES_COUNT;
    const outerTile = state.tiles[outerTileIndex];
    if (outerTile?.name === TILE_TYPES.alley) {
        return {
            tile: outerTile.moveTo,
            progress: nextProgress + outerTile.progressOffset,
            alleyEntry: outerTileIndex,
        };
    }

    if (outerTile?.name === TILE_TYPES.jailEnter) {
        return {
            tile: outerTile.firstJailTile,
            progress: nextProgress,
        };
    }

    return {
        tile: outerTileIndex,
        progress: nextProgress,
    };
};

export const getRequiredMoveForPiece = (state, piece, player) => {
    if (isGameOver(state) || hasPlayerFinished(state, player.color) || isPieceInHand(piece) || state.moves.length === 0) {
        return null;
    }

    if (isPieceInPrison(state, piece)) {
        return state.moves.includes(6) ? 6 : null;
    }

    if (isPieceInJail(state, piece)) {
        if (state.sizoMoveUsed) {
            return null;
        }

        const requiredMove = state.tiles[piece.tile].needToRoll;
        return state.moves[0] === requiredMove ? requiredMove : null;
    }

    const moveValue = state.moves[0];
    return calculateOrdinaryMove({ state, piece, player, moveValue }) ? moveValue : null;
};

export const canPieceMove = (state, piece, player) =>
    getRequiredMoveForPiece(state, piece, player) !== null;

// A preview follows the same next die and automatic transfers as the actual move.
export const getPieceMovePreview = (state, piece, player) => {
    if (isGameOver(state) || hasPlayerFinished(state, player.color) || state.isRolling) return null;
    if (isPieceInHand(piece)) {
        return state.canPlace ? { action: 'place', tile: player.start, path: [player.start], targets: [player.start] } : null;
    }
    if (!state.canMove || getRequiredMoveForPiece(state, piece, player) === null) return null;
    if (isPieceInPrison(state, piece)) {
        return { action: 'move', tile: null, path: [null], targets: [] };
    }
    if (isPieceInJail(state, piece)) {
        const jail = state.tiles[piece.tile];
        const tile = jail.nextTile ?? jail.exitTile;
        return { action: 'move', tile, path: [tile], targets: [tile] };
    }
    const destination = calculateOrdinaryMove({ state, piece, player, moveValue: state.moves[0] });
    const progress = getPieceProgress(state, piece, player);
    const path = Array.from({ length: state.moves[0] }, (_, index) => {
        const next = progress + index + 1;
        return next >= FIRST_HOME_PROGRESS ? player.home[next - FIRST_HOME_PROGRESS]
            : (player.start + next) % OUTER_LAYER_TILES_COUNT;
    });
    const landingTile = path[path.length - 1];
    if (landingTile !== destination.tile) path.push(destination.tile);
    return { action: 'move', tile: destination.tile, path, targets: [...new Set([landingTile, destination.tile])] };
};

export const calculateActionFlags = (state) => {
    if (isGameOver(state) || hasPlayerFinished(state, state.players[state.currentPlayerIndex].color) || state.isRolling) {
        return { canMove: false, canPlace: false };
    }

    const player = state.players[state.currentPlayerIndex];
    const pieces = state.pieces[player.color];

    return {
        canMove: pieces.some((piece) => canPieceMove(state, piece, player)),
        canPlace: state.moves.includes(6) && pieces.some(isPieceInHand),
    };
};

export const countOccupiedHomeCells = (pieces, home) => {
    const occupiedTiles = new Set(pieces.map(piece => piece.tile));
    return home.filter(tile => occupiedTiles.has(tile)).length;
};

export const isWinningPosition = (state, player) =>
    countOccupiedHomeCells(state.pieces[player.color], player.home) === player.home.length;
