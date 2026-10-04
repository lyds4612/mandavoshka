import { playerStyle } from './gamePresentation';
import PieceReserve from './pieces/PieceReserve';
import PieceActions from './pieces/PieceActions';

const MobileHand = ({ player, pieces, tiles, prisonTileIndex, interaction }) => player && <section
    className="mobile-hand" aria-label="Фишки и действие текущего игрока" style={playerStyle(player.color)}>
    <PieceReserve color={player.color} pieces={pieces} tiles={tiles} prisonTileIndex={prisonTileIndex} interaction={interaction} />
    <PieceActions interaction={interaction} />
    <span className="mobile-action-announcement" role="status" aria-live="polite">{interaction.hint}</span>
</section>;
export default MobileHand;
