import { OUTER_LAYER_TILES_COUNT } from '../gameBoardInit';
import { TILE_TYPES } from '../utils/tileUtils';

export const LAST_HOME_PROGRESS = OUTER_LAYER_TILES_COUNT + 3;

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
    if (Number.isInteger(piece.progress)) {
        return piece.progress;
    }

    if (isPieceAtHome(state, piece)) {
        return OUTER_LAYER_TILES_COUNT + state.tiles[piece.tile].position;
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

    if (nextProgress >= OUTER_LAYER_TILES_COUNT) {
        return {
            tile: player.home[nextProgress - OUTER_LAYER_TILES_COUNT],
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
    if (isPieceInHand(piece) || state.moves.length === 0) {
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

export const calculateActionFlags = (state) => {
    if (state.winner || state.isRolling) {
        return { canMove: false, canPlace: false };
    }

    const player = state.players[state.currentPlayerIndex];
    const pieces = state.pieces[player.color];

    return {
        canMove: pieces.some((piece) => canPieceMove(state, piece, player)),
        canPlace: state.moves.includes(6) && pieces.some(isPieceInHand),
    };
};

export const isWinningPosition = (state, player) => {
    const finalHomeTile = player.home[player.home.length - 1];
    return state.pieces[player.color].every((piece) => piece.tile === finalHomeTile);
};
