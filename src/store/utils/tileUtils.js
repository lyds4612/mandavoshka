export const TILE_TYPES = {
    jailEnter: 'jail-enter',
    jailExit: 'jail-exit',
    jail: 'jail',
    prison: 'prison',
    start: 'start',
    freedom: 'freedom',
};

export const isPrisonTile = (tile) => tile?.name === TILE_TYPES.prison;

export const findPrisonTileIndex = (tiles) => {
    const prisonTile = tiles.find((tile) => tile.name === TILE_TYPES.prison);
    return prisonTile?.index;
};

export const calculateDestinationTile = ({ tiles, fromTile, moveValue }) => {
    let destinationTile = fromTile + moveValue;

    if (tiles[destinationTile]?.name !== TILE_TYPES.jail) {
        return destinationTile;
    }

    while (tiles[destinationTile]?.name === TILE_TYPES.jail) {
        destinationTile -= 1;
    }

    const jailDiff = destinationTile - fromTile - 1;
    return moveValue - jailDiff;
};
