import { pieceId } from './usePieceInteraction';

export const pieceLocation = (piece, tiles, prisonTileIndex) => {
    if (piece.tile === null) return 'В руке';
    if (piece.tile === prisonTileIndex) return 'В тюрьме';
    if (tiles[piece.tile]?.name === 'jail') return `СИЗО ${['I', 'II', 'III'][tiles[piece.tile].needToRoll - 1]}`;
    if (tiles[piece.tile]?.name === 'home') return `В хате, клетка ${tiles[piece.tile].position + 1}`;
    return 'На поле';
};

const PieceReserve = ({ color, pieces, tiles, prisonTileIndex, interaction }) => <div
    className={`player-reserve ${interaction.returnColor === color ? 'is-return-target' : ''} ${interaction.drag?.target === 'reserve' && interaction.returnColor === color ? 'is-drop-hover' : ''}`}
    data-reserve-color={color} aria-label="Фишки игрока">
    {pieces.map((piece, index) => {
        const id = pieceId(color, index), selectable = Boolean(interaction.available[id]);
        const draggable = piece.tile === null && selectable;
        return <button type="button" key={id} className={`reserve-slot ${piece.tile !== null ? 'is-away' : ''} ${draggable ? 'is-draggable' : ''} ${interaction.selectedId === id ? 'is-selected' : ''}`}
            disabled={!selectable && interaction.returnColor !== color} data-piece-id={piece.tile === null ? id : undefined}
            data-reserve-piece={id} onClick={() => interaction.onReserveClick(color, index)}
            aria-label={`Фишка ${index + 1}: ${pieceLocation(piece, tiles, prisonTileIndex)}${draggable ? '. Поставить на старт' : selectable ? '. Выбрать для хода' : ''}`}
            title={`Фишка ${index + 1}: ${pieceLocation(piece, tiles, prisonTileIndex)}`}>
            {piece.tile === null ? <span data-piece-id={id} data-piece-color={color} className={`piece ${draggable ? 'is-draggable' : ''} ${interaction.drag?.id === id ? 'is-drag-source' : ''}`} />
                : <span className="away-piece-mark" aria-hidden="true">{piece.tile === prisonTileIndex ? '↩' : tiles[piece.tile]?.name === 'jail' ? ['I','II','III'][tiles[piece.tile].needToRoll - 1] : tiles[piece.tile]?.name === 'home' ? '◆' : index + 1}</span>}
        </button>;
    })}
</div>;
export default PieceReserve;
