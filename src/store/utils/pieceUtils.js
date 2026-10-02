export const findPlayerPieceOnTile = ({ pieces, playerColor, tileIndex, pieceIndex }) => {
    if (pieceIndex !== undefined) {
        const piece = Number.isInteger(pieceIndex) ? pieces[playerColor][pieceIndex] : null;
        return piece?.tile === tileIndex ? piece : undefined;
    }
    return pieces[playerColor].find((piece) => piece.tile === tileIndex);
};

export const moveCapturedOpponentsToPrison = ({ pieces, currentPlayerColor, targetTile, prisonTileIndex }) => {
    Object.entries(pieces).forEach(([pieceColor, playerPieces]) => {
        if (pieceColor === currentPlayerColor) {
            return;
        }

        for (let i = 0; i < playerPieces.length; i += 1) {
            if (playerPieces[i].tile === targetTile) {
                playerPieces[i].tile = prisonTileIndex;
                playerPieces[i].progress = null;
            }
        }
    });
};
