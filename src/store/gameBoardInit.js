
const RIGHT = [1, 0];
const LEFT = [-1, 0];
const DOWN = [0, 1];
const UP = [0, -1];

const SIDE_SIZE = 12;

export const createInitialPlayerState = (state) => {
    state.dice = [null, null];
    state.canRoll = true;
    state.canMove = false;
    state.canPlace = false;
    state.moves = [];
}

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

const createInitialPieces = (color) => {
    const pieces = [];
    for (let i = 0; i < 4; i += 1) {
        pieces.push({
            color,
            tile: null,
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
            canGoToHome: false,
            moves: [],
            lastDice: [],
        }
        pieces[color] = createInitialPieces(color)
        players.push(player);
    }
    return {players, pieces}
}

export const createInitialGameState = () => {
    const tiles = Array(SIDE_SIZE * 4)
        .fill(null)
        .map((_, i) => ({
            index: i,
            name: 'freedom',
        }));

    const {players, pieces} = createInitialPlayers([
        'red',
        'blue',
        'green',
        'orange'
    ])

    const innerLayer = calculateBoardIndexes({
        initialMove: DOWN,
        side: SIDE_SIZE - 2,
        max: 3 * 4,
        gridOffset: 1,
        rotate(pos, move) {
            if (move[0] === 0 && move[1] === 1) {
                move = RIGHT
                pos[1] += 8
                pos[0] -= 1
            }

            else if (move[0] === 1 && move[1] === 0) {
                move = UP
                pos[0] += 8
                pos[1] += 1
            }

            else if (move[0] === 0 && move[1] === -1) {
                move = LEFT
                pos[1] -= 8
                pos[0] += 1
            }
            return move;
        },
        shouldRotate(pos, options, i) {
            if (i === 2 || i === 5 || i === 8 || i === 11) {
                return true
            }
        }
    })

    const outerLayer = calculateBoardIndexes({
        side: SIDE_SIZE,
        max: SIDE_SIZE * 4,
    })

    innerLayer.forEach(() => {
        tiles.push({
            index: tiles.length,
            name: 'jail'
        })
    })

    const indexes = [
        ...outerLayer,
        ...innerLayer,
    ]

    const reversed = {}

    indexes.forEach(([x, y], index) => {
        reversed[`${x}, ${y}`] = index;
    })

    const tileIndexes = {
        index: indexes,
        pos: reversed,
    }

    console.log(`Game created with ${players.length} players and ${tiles.length} tiles`);
    console.log(`Starting position for players`, players.map((player) => player.start));

    const state = {
        currentPlayerIndex: 0,
        tiles,
        players,
        currentPlayer: players[0],
        tileIndexes,
        pieces,
    }

    createInitialPlayerState(state);

    return state
};
