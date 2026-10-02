export const PieceActionButton = ({ interaction }) => {
    const selected = interaction.available[interaction.selectedId];
    const moving = selected?.action === 'move';
    const returning = moving && selected.tile === null;
    return <button type="button" className="piece-confirm-action" disabled={Boolean(interaction.drag) || (!moving && !interaction.canPlace)}
        onClick={moving ? interaction.moveSelected : interaction.placeFromHand}
        aria-label={returning ? 'Вернуть выбранную фишку в руку' : moving ? 'Передвинуть выбранную фишку' : 'Поставить фишку на старт'}>
        <span aria-hidden="true">{returning ? '↩' : moving ? '→' : '+'}</span><span>{returning ? 'В руку' : moving ? 'Сходить' : 'На старт'}</span>
    </button>;
};

const PieceActions = ({ interaction }) => <div className="player-piece-actions">
    <PieceActionButton interaction={interaction} />
    <button type="button" className="cancel-piece-selection" aria-label="Отменить выбор" title="Отменить выбор"
        disabled={!interaction.selectedId || Boolean(interaction.drag)} onClick={interaction.clearSelection}>×</button>
</div>;

export default PieceActions;
