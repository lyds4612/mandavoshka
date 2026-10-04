import GameDialog from '../GameDialog';
import { playerStyle } from '../gamePresentation';
import { pieceLocation } from './PieceReserve';

const PieceChooser = ({ interaction, tiles, prisonTileIndex }) => <GameDialog open={interaction.pile.length > 0}
    title="Какую фишку выбрать?" onClose={interaction.closePile} className="piece-chooser">
    <div className="piece-choices">{interaction.pile.map(({ id, piece, index, move }) => <button type="button" key={id}
        className="piece-choice" data-choice-piece={id} style={playerStyle(piece.color)} disabled={!move}
        aria-pressed={interaction.selectedId === id} onClick={() => interaction.choosePiece(id)}>
        <span className="piece" aria-hidden="true" /><span><strong>Фишка {index + 1}</strong>
            <small>{pieceLocation(piece, tiles, prisonTileIndex)}{!move ? ' · недоступна сейчас' : move.tile === null ? ' · вернуть в руку за 6' : ''}</small></span>
    </button>)}</div>
</GameDialog>;
export default PieceChooser;
