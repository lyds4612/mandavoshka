const ICON_PATHS = {
    place: 'M12 5v14M5 12h14',
    move: 'M5 12h14M13 6l6 6-6 6',
    return: 'M9 4 4 9l5 5M4 9h9a6 6 0 0 1 0 12h-3',
    cancel: 'M6 6l12 12M18 6 6 18',
};
const PieceActionIcon = ({ action }) => <svg className="piece-action-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={ICON_PATHS[action]} />
</svg>;

export const PieceActionButton = ({ interaction }) => {
    const selected = interaction.available[interaction.selectedId];
    const moving = selected?.action === 'move';
    const returning = moving && selected.tile === null;
    return <button type="button" className="piece-confirm-action" disabled={Boolean(interaction.drag) || (!moving && !interaction.canPlace)}
        onClick={moving ? interaction.moveSelected : interaction.placeFromHand}
        aria-label={returning ? 'Вернуть выбранную фишку в руку' : moving ? 'Передвинуть выбранную фишку' : 'Поставить фишку на старт'}>
        <PieceActionIcon action={returning ? 'return' : moving ? 'move' : 'place'} /><span>{returning ? 'В руку' : moving ? 'Сходить' : 'На старт'}</span>
    </button>;
};

const PieceActions = ({ interaction }) => <div className="player-piece-actions">
    <PieceActionButton interaction={interaction} />
    <button type="button" className="cancel-piece-selection" aria-label="Отменить выбор" title="Отменить выбор"
        disabled={!interaction.selectedId || Boolean(interaction.drag)} onClick={interaction.clearSelection}><PieceActionIcon action="cancel" /></button>
</div>;

export default PieceActions;
