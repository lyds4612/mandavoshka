class Player {
    constructor(color, start) {
        this.color = color;
        this.start = 0;
        this.canGoToHome = false;
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
        this.name = name
        this.pieces = []
    }
    placePiece(piece) {
        this.pieces.add(piece);
    }
    // removePiece(piece) {
    //     this.pieces.find(piece => piece.name === piece.name);
    // }
}

class GameState {
    #currentPlayerIndex = 0;
    constructor() {
        const side = 13;

        this.tiles = new Array(side * 4).fill(0).map((_v,i) => {
            if (i > 0 && (i % 6 === 0)) {
                return new Tile('start', i);
            }
            return new Tile('freedom', i)
        });

        const getStartPos = (offset ) => 6 + side * offset;
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
            this.#currentPlayerIndex++;
        }
        return this.players[this.#currentPlayerIndex];
    }

    rollDice(player) {
        const dice = [Math.ceil(Math.random() * 6), Math.ceil(Math.random() * 6)];
        //todo check if player has pieces in jail,
        const canMove = (dice.includes(6) && player.pieces === 4) || true;

        if (!canMove) {
            this.changePlayer();
        }

        return dice;
    }

    placePiece (player) {
        console.log('Placing piece', player);
        if (player.pieces.length) {
            const piece = player.pop();
            piece.tile = this.tiles[player.start];
            this.tiles[player.start].placePiece();
        }
    }

    movePiece(dice, piece) {
        console.log('Moving piece', piece);
        if (piece.tile) {
            const currentTile = piece.tile;
            const pieceIndex = currentTile.pieces.findIndex((p) => p.color === piece.player.color);
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

