import CharacterPicker from './CharacterPicker';
import LocalCharacterRoster from './LocalCharacterRoster';
import BotCountPicker from './BotCountPicker';
import './MultiplayerPanel.css';

const LocalGameSetup = ({ mode, botCount, onBotCountChange, characterId, onCharacterChange, name, onNameChange, roster, onRosterChange, onRandomize, onStart, onBack }) => (
    <main className="multiplayer-panel is-character-setup local-game-setup" aria-label="Настройка локальной партии">
        <div className="game-setup-heading"><div><span className="eyebrow">{mode === 'bots' ? 'С ботами' : 'Без ботов'}</span><h2>Выберите своего героя</h2></div>
            <button type="button" className="button button-quiet back-game-menu" onClick={onBack}>← В меню</button></div>
        <form className="online-form local-setup-form" onSubmit={event => { event.preventDefault(); onStart(); }}>
            <CharacterPicker value={characterId} onChange={onCharacterChange} />
            {mode === 'bots' && <BotCountPicker context="local" min={1} value={botCount} onChange={onBotCountChange} hint="Вы и выбранное число соперников за одним столом." />}
            <LocalCharacterRoster roster={roster} characterId={characterId} onChange={onRosterChange} onRandomize={onRandomize} bots={mode === 'bots'} />
            <label className="local-nickname">Ваш ник <span>необязательно</span><input maxLength={24} autoComplete="nickname" value={name} onChange={event => onNameChange(event.target.value)} placeholder="Или оставьте имя героя" /></label>
            <div className="local-start-actions"><button type="submit" className="button button-primary start-local-game" disabled={!characterId}>Начать партию <span aria-hidden="true">→</span></button>
                <p>{mode === 'bots' ? 'Вы играете за своего героя. Остальные ходят сами.' : 'Четыре героя, один экран. Все ходы — в ваших руках.'}</p></div>
        </form>
    </main>
);

export default LocalGameSetup;
