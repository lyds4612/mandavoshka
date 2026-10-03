import { PLAYER_THEMES } from './gamePresentation';

const GameResults = ({ winners, loser, participants = [], canRestart, onRestart }) => {
    const name = color => participants.find(player => player.color === color)?.name ?? PLAYER_THEMES[color].name;
    return <div className="game-results" role="status" aria-live="polite">
        <div className="game-results-card">
            <h2>Партия завершена</h2>
            <p className="game-results-label">{winners.length === 1 ? 'Победитель' : 'Победители'}</p>
            <ul className="game-results-winners">
                {winners.map(color => <li key={color} data-player-color={color}><span aria-hidden="true">✓</span><strong>{name(color)}</strong></li>)}
            </ul>
            <div className="game-results-loser" data-player-color={loser}><span>Не успел</span><strong>{name(loser)}</strong></div>
            {canRestart ? <button type="button" className="button button-gold results-restart" onClick={onRestart}>Новая партия</button>
                : <p className="game-results-waiting">Новую партию начнёт хозяин комнаты</p>}
        </div>
    </div>;
};

export default GameResults;
