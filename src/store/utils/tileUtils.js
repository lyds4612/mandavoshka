export const TILE_TYPES = {
    jailEnter: 'jail-enter',
    jail: 'jail',
    prison: 'prison',
    freedom: 'freedom',
    alley: 'alley',
    home: 'home',
};

export const isPrisonTile = (tile) => tile?.name === TILE_TYPES.prison;

export const findPrisonTileIndex = (tiles) => {
    const prisonTile = tiles.find((tile) => tile.name === TILE_TYPES.prison);
    return prisonTile?.index;
};
