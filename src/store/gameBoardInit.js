import { TILE_TYPES, findPrisonTileIndex }    from './utils/tileUtils';

const consoleWrapper = (text) => {
    console.log(`%c[MDEV] %c${text}`, "color: orange", "color: initial")
}

const debugLog = consoleWrapper;

const RIGHT = [1, 0];
const LEFT = [-1, 0];
const DOWN = [0, 1];
const UP = [0, -1];

export const SIDE_SIZE = 12;
export const OUTER_LAYER_TILES_COUNT = SIDE_SIZE * 4;
const INNER_LAYER_TILES_COUNT = 3 * 4;
const INNER_LAYER_SIDE = SIDE_SIZE - 2;
const INNER_LAYER_OFFSET = 1;
const INNER_LAYER_JUMP = 8;
export const PIECES_PER_PLAYER = 4;
export const PLAYER_COLORS = ['green', 'black', 'red', 'orange'];

export const ALLEY_PAIRS = [[4, 44], [8, 16], [20, 28], [32, 40]];

export const JAILS = {
    9: {
        tiles: [59, 58, 57]
    },
    21: {
        tiles: [56, 55, 54]
    },
    33: {
        tiles: [53, 52, 51]
    },
    45: {
        tiles: [50, 49, 48]
    }
};

const HOME_TILE_POSITIONS = {
    green: [[6, 1], [6, 2], [6, 3], [6, 4]],
    black: [[11, 6], [10, 6], [9, 6], [8, 6]],
    red: [[6, 11], [6, 10], [6, 9], [6, 8]],
    orange: [[1, 6], [2, 6], [3, 6], [4, 6]],
};

const defaultRotate = (pos, move) => {
    const [x, y] = move;
    if (x === 1 && y === 0) {
        move = DOWN;
    } else if (x === 0 && y === 1) {
        move = LEFT;
    } else if (x === -1 && y === 0) {
        move = UP;
    }
    return move
};

const defaultShouldRotate = (pos, options, i) => {
    return i !== 0 && (i % options.side) === 0
}

const calculateBoardIndexes = (options) => {
    const {
        gridOffset  = 0,
        max = SIDE_SIZE * 4,
        shouldRotate = defaultShouldRotate,
        rotate = defaultRotate,
        initialMove = RIGHT,
    } = options

    let move = initialMove;
    let pos = [0, 0];
    let indexes = [];

    for (let i = 0; i < max; i++) {
        if (i !== 0) {
            pos[0] += move[0];
            pos[1] += move[1];
        }

        indexes.push([pos[0] + gridOffset, pos[1] + gridOffset]);
        if (shouldRotate(pos, options, i)) {
            move = rotate(pos, move);
        }
    }

    return indexes;
}

const createBaseTiles = (count) => {
    return Array(count)
        .fill(null)
        .map((_, i) => ({
            index: i,
            name: TILE_TYPES.freedom,
        }));
};

const appendJailTiles = (tiles, count) => {
    for (let i = 0; i < count; i += 1) {
        tiles.push({
            index: tiles.length,
            name: TILE_TYPES.jail,
        });
    }
};

const appendPrisonTile = (tiles) => {
    tiles.push({
        index: tiles.length,
        name: TILE_TYPES.prison,
    });
};

const appendHomeTiles = (tiles, players) => {
    const homeTilePositions = [];

    players.forEach((player) => {
        player.home = HOME_TILE_POSITIONS[player.color].map((position, homePosition) => {
            const tileIndex = tiles.length;
            tiles.push({
                index: tileIndex,
                name: TILE_TYPES.home,
                owner: player.color,
                position: homePosition,
            });
            homeTilePositions.push({ tileIndex, position });
            return tileIndex;
        });
    });

    return homeTilePositions;
};

const createInnerLayerIndexes = () => {
    return calculateBoardIndexes({
        initialMove: DOWN,
        side: INNER_LAYER_SIDE,
        max: INNER_LAYER_TILES_COUNT,
        gridOffset: INNER_LAYER_OFFSET,
        rotate(pos, move) {
            if (move[0] === 0 && move[1] === 1) {
                move = RIGHT;
                pos[1] += INNER_LAYER_JUMP;
                pos[0] -= 1;
            } else if (move[0] === 1 && move[1] === 0) {
                move = UP;
                pos[0] += INNER_LAYER_JUMP;
                pos[1] += 1;
            } else if (move[0] === 0 && move[1] === -1) {
                move = LEFT;
                pos[1] -= INNER_LAYER_JUMP;
                pos[0] += 1;
            }
            return move;
        },
        shouldRotate(pos, options, i) {
            return i === 2 || i === 5 || i === 8 || i === 11;
        }
    });
};

const createOuterLayerIndexes = () => {
    return calculateBoardIndexes({
        side: SIDE_SIZE,
        max: OUTER_LAYER_TILES_COUNT,
    });
};

const applyJails = (tiles, jails) => {
    Object.entries(jails).forEach(([tileEnterIndex, data]) => {
        const entryTile = Number(tileEnterIndex);
        const exitTile = entryTile + 2;
        tiles[entryTile].name = TILE_TYPES.jailEnter;
        tiles[entryTile].firstJailTile = data.tiles[0];
        tiles[entryTile].moveTo = data.tiles[0];

        data.tiles.forEach((tileIndex, index) => {
            tiles[tileIndex].name = TILE_TYPES.jail;
            tiles[tileIndex].needToRoll = index + 1;
            tiles[tileIndex].entryTile = entryTile;
            if (index < data.tiles.length - 1) {
                tiles[tileIndex].nextTile = data.tiles[index + 1];
            } else {
                tiles[tileIndex].exitTile = exitTile;
                tiles[tileIndex].moveTo = exitTile;
            }
        });
    });
};

const applyAlleys = (tiles) => {
    ALLEY_PAIRS.forEach(([first, second]) => {
        [[first, second], [second, first]].forEach(([from, to]) => {
            const forwardDistance = (to - from + OUTER_LAYER_TILES_COUNT) % OUTER_LAYER_TILES_COUNT;
            tiles[from].name = TILE_TYPES.alley;
            tiles[from].moveTo = to;
            tiles[from].progressOffset = forwardDistance > OUTER_LAYER_TILES_COUNT / 2
                ? forwardDistance - OUTER_LAYER_TILES_COUNT
                : forwardDistance;
        });
    });
};

const buildTileIndexes = ({ outerLayer, innerLayer, prisonTileIndex, homeTilePositions }) => {
    const indexes = [
        ...outerLayer,
        ...innerLayer,
    ];

    indexes[prisonTileIndex] = [6, 6];
    homeTilePositions.forEach(({ tileIndex, position }) => {
        indexes[tileIndex] = position;
    });

    const reversed = {};

    indexes.forEach(([x, y], index) => {
        reversed[`${x}, ${y}`] = index;
    });

    return {
        index: indexes,
        pos: reversed,
    };
};

const logInitialGameMeta = ({ players, tiles, jails }) => {
    debugLog(`Game created with ${players.length} players and ${tiles.length} tiles`);
    debugLog(`Starting position for players [${players.map((player) => player.start).join(', ')}]`);
    debugLog(`Jail entrances: [${JSON.stringify(jails)}]`);
};

const createInitialPieces = (color) => {
    const pieces = [];
    for (let i = 0; i < PIECES_PER_PLAYER; i += 1) {
        pieces.push({
            color,
            tile: null,
            progress: null,
        })
    }
    return pieces;
}

const createInitialPlayers = (colors) =>  {
    const getStartPos = (offset) => 6 + SIDE_SIZE * (offset - 1);

    const players = [];
    const pieces = {};
    for (let i = 0; i < colors.length; i += 1) {
        const color = colors[i];
        const player = {
            color,
            start: getStartPos(i + 1),
            home: [],
            moves: [],
            lastDice: [],
        }
        pieces[color] = createInitialPieces(color)
        players.push(player);
    }
    return {players, pieces}
}

export const createInitialGameState = () => {
    const tiles = createBaseTiles(OUTER_LAYER_TILES_COUNT);
    const {players, pieces} = createInitialPlayers(PLAYER_COLORS);

    const innerLayer = createInnerLayerIndexes();
    const outerLayer = createOuterLayerIndexes();

    appendJailTiles(tiles, innerLayer.length);
    appendPrisonTile(tiles);
    applyJails(tiles, JAILS);
    applyAlleys(tiles);
    const homeTilePositions = appendHomeTiles(tiles, players);

    const tileIndexes = buildTileIndexes({
        outerLayer,
        innerLayer,
        prisonTileIndex: findPrisonTileIndex(tiles),
        homeTilePositions,
    });

    logInitialGameMeta({
        players,
        tiles,
        jails: JAILS,
    });
    
    const state = {
        currentPlayerIndex: 0,
        tiles,
        players,
        tileIndexes,
        pieces,
        prisonTileIndex: findPrisonTileIndex(tiles),
        winner: null,
        bonusRollPending: false,
        sizoMoveUsed: false,
        turnMessage: 'Бросьте кубики.',
        dice: [null, null],
        diceRoll: null,
        rollCount: 0,
        isRolling: false,
        moves: [],
        canRoll: true,
        canMove: false,
        canPlace: false,
    }

    return state
};
