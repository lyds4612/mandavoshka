class Player {
    constructor(color, start) {
        this.color = color;
        this.start = start;
        this.canGoToHome = false;

        this.moves = [];
        this.pieces = [
            new Piece(color, this),
            new Piece(color, this),
            new Piece(color, this),
            new Piece(color, this),
        ]
    }
}

class Piece {
    constructor(color, player) {
        this.player = player;
        this.color = color;
        this.tile = null;
    }
}

//todo jail, prison, start,
class Tile {
    constructor(name, index) {
        this.index = index;
        this.name = name;
        this.pieces = [];
    }
    placePiece(piece) {
        this.pieces.push(piece);
    }
    removePiece(piece) {
        const index = this.pieces.findIndex(p => p === piece);
        if (index > -1) {
            this.pieces.splice(index, 1);
        }
    }
}

class GameState implements ProxyConstructor {
    #currentPlayerIndex = 0;
    constructor() {
        const side = 13;

        this.tiles = new Array(side * 4).fill(0).map((_v,i) => {
            if (i > 0 && (i % 6 === 0)) {
                return new Tile('start', i);
            }
            return new Tile('freedom', i)
        });

        const getStartPos = (offset) => 6 + side * offset;
        this.players = [
            new Player('red', getStartPos(1)),
            new Player('blue', getStartPos(2)),
            new Player('green', getStartPos(3)),
            new Player('yellow', getStartPos(4)),
        ];
        this.player = this.players[0];
    }

    changePlayer() {
        if (this.#currentPlayerIndex === 3) {
            this.#currentPlayerIndex = 0;
        } else {
            this.#currentPlayerIndex += 1;
        }
        this.player = this.players[this.#currentPlayerIndex]
    }

    rollDice(player) {
        const roll = () => Math.ceil(Math.random() * 6)
        const dice = [roll(), roll()];
        //todo check if player has pieces in jail,

        const pieces = player.pieces;
        // const canMove = pieces.some(piece => piece.tile !== null);
        const canMove = false;
        const canPlace = dice.includes(6) && pieces.some(piece => piece.tile === null);
        // const canRoll = dice.every(i => i === 6);
        const canRoll = true;
        if (!canPlace && !canMove) {
            this.changePlayer();
            return {
                dice: ['-', '-'],
                canRoll: true,
                canMove: false,
                canPlace: false,
            }
        }

        return {
            dice,
            canMove,
            canPlace,
            canRoll,
        };
    }

    placePiece(player) {
        const piece = player.pieces.filter(piece => piece.tile === null)[0];
        console.log('Placing piece', piece);
        if (piece) {
            const startTile = this.tiles[player.start];
            piece.tile = startTile;
            startTile.placePiece(piece);
            this.changePlayer();
            return {
                dice: ['-', '-'],
                canRoll: true,
                canMove: false,
                canPlace: false,
            }
        } else {
            console.error('Nothing to place', player);
        }
    }

    movePiece(dice, piece) {
        console.log('Moving piece', piece);
        if (piece.tile) {
            const currentTile = piece.tile;
            const pieceIndex = currentTile.pieces.findIndex((p) => p === piece.player);
            const nextPlace = currentTile.index + dice;
            currentTile.pieces.splice(pieceIndex, 1)
            piece.tile = this.tiles[nextPlace];
            return nextPlace;
        } else {
            return piece.player.start;
        }
    }
}

const gameState = new GameState();
export default gameState;

