import './GameMenu.css';

const MODES = [
    { id: 'bots', title: 'С ботами', caption: 'Ваша партия', description: 'Выберите героя и число соперников за этим столом.', icon: '♟', badge: '1 игрок · 1–3 бота' },
    { id: 'manual', title: 'Без ботов', caption: 'За одним экраном', description: 'Играйте с друзьями рядом или управляйте всеми четырьмя героями сами.', icon: '♣', badge: 'Все ходы вручную' },
    { id: 'online', title: 'Онлайн', caption: 'Вместе на расстоянии', description: 'Создайте комнату или войдите по коду. Пригласите друзей и добавьте ботов.', icon: '◎', badge: '2–4 места · друзья и боты' },
];

const GameMenu = ({ onChoose, canContinue, onContinue, mode }) => (
    <main className="game-menu" aria-label="Главное меню">
        <div className="game-menu-intro"><span className="eyebrow">Ваш стол ждёт</span><h2>С кем сыграем?</h2><p>Выберите игру, а затем — своего персонажа.</p></div>
        {canContinue && <button type="button" className="continue-local-game" onClick={onContinue}>
            <span aria-hidden="true">▶</span><div><strong>Продолжить партию</strong><span>{mode === 'bots' ? 'С ботами' : 'Без ботов'} · ваш состав сохранён</span></div><span aria-hidden="true">→</span>
        </button>}
        <div className="game-mode-choices">{MODES.map(choice => (
            <button type="button" key={choice.id} className={`game-mode-choice game-mode-${choice.id}`} data-game-mode={choice.id} aria-label={choice.title} onClick={() => onChoose(choice.id)}>
                <span className="game-mode-icon" aria-hidden="true">{choice.icon}</span>
                <span className="game-mode-copy"><span className="game-mode-caption">{choice.caption}</span><strong>{choice.title}</strong><span className="game-mode-description">{choice.description}</span></span>
                <span className="game-mode-footer"><span>{choice.badge}</span><span aria-hidden="true">→</span></span>
            </button>
        ))}</div>
        <p className="game-menu-note">Знакомый стол, семь героев, одна цель — завести фишки в хату.</p>
    </main>
);

export default GameMenu;
