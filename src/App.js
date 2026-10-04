import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import './App.css';
import './themes/prison.css';
import GameBoard from './components/GameBoard';
import PlayerCard from './components/PlayerCard';
import RulesDialog from './components/RulesDialog';
import MultiplayerPanel from './components/MultiplayerPanel';
import GameMenu from './components/GameMenu';
import SoundSettings from './components/SoundSettings';
import LocalGameSetup from './components/LocalGameSetup';
import MobilePlayers from './components/MobilePlayers';
import MobileHand from './components/MobileHand';
import PieceChooser from './components/pieces/PieceChooser';
import TutorialDialog from './components/TutorialDialog';
import GameDialog from './components/GameDialog';
import GameResults from './components/GameResults';
import BoardViewport from './components/BoardViewport';
import FullscreenButton from './components/fullscreen/FullscreenButton';
import { useGameFullscreen } from './components/fullscreen/useGameFullscreen';
import { getInvitationCode } from './multiplayer/invitation.js';
import { getConnectionNotice } from './multiplayer/connectionNotice.js';
import { getCharacter } from './shared/characters';
import { createLocalRoster, selectLocalCharacter, selectLocalColor } from './components/characterRoster';
import { readPlayerProfile, savePlayerProfile } from './shared/playerProfile';
import { selectCanControlGame, selectCanRestart, selectMultiplayer } from './store/multiplayerSlice.js';
import { pauseLocalGame, resumeLocalGame, selectLocalGame, startLocalGame } from './store/localGameSlice.js';
import { useLocalBots } from './bots/useLocalBots';
import { Fleur } from './components/Ornaments';
import ThemeSwitcher, { PrisonEmblem, useVisualTheme } from './components/ThemeSwitcher';
import { PLAYER_THEMES, playerStyle, tableStyle } from './components/gamePresentation';
import { usePieceInteraction } from './components/pieces/usePieceInteraction';
import { usePieceMotion } from './components/pieces/usePieceMotion';
import { useGameSounds } from './sound/useGameSounds';
import './components/pieces/PieceInteraction.css';
import './components/BoardControls.css';
import './components/MobileGame.css';
import './components/fullscreen/FullscreenGame.css';
import { finishDiceRoll, movePiece, placePiece, resetGame, rollDice } from './store/gameSlice';
import {
    selectActionFlags, selectCurrentPlayerColor, selectGameState, selectIsRolling,
    selectMovableTileIndexes, selectPieces, selectPlayers, selectWinners, selectLoser, selectGameOver,
} from './store/selectors/gameSelectors';

const App = () => {
    const dispatch = useDispatch();
    const [profile, setProfile] = useState(readPlayerProfile);
    const { characterId, name: playerName } = profile;
    const setCharacterId = id => setProfile(value => ({ ...value, characterId: id }));
    const setPlayerName = name => setProfile(value => ({ ...value, name }));
    const [localRoster, setLocalRoster] = useState(() => createLocalRoster(profile.characterId, profile.color));
    const [screen, setScreen] = useState('menu');
    const [setupMode, setSetupMode] = useState(null);
    const [botCount, setBotCount] = useState(3);
    const [inviteCode, setInviteCode] = useState(getInvitationCode);
    const local = useSelector(selectLocalGame);
    const game = useSelector(selectGameState);
    const currentPlayerColor = useSelector(selectCurrentPlayerColor);
    const pieces = useSelector(selectPieces);
    const players = useSelector(selectPlayers);
    const movableTileIndexes = useSelector(selectMovableTileIndexes);
    const winners = useSelector(selectWinners);
    const loser = useSelector(selectLoser);
    const gameOver = useSelector(selectGameOver);
    const isRolling = useSelector(selectIsRolling);
    const canControl = useSelector(selectCanControlGame);
    const canRestart = useSelector(selectCanRestart);
    const network = useSelector(selectMultiplayer);
    const previousNetworkMode = useRef(network.mode);
    const invited = Boolean(inviteCode);
    const networkScreen = network.mode === 'online' || invited || network.recoveryStatus !== 'ready';
    const showTable = network.mode === 'online' ? Boolean(network.room) : screen === 'playing' && local.active && !invited && network.recoveryStatus === 'ready';
    const gamePhase = network.mode === 'online' ? network.room?.phase : 'playing';
    const notice = getConnectionNotice(network);
    const connected = network.status === 'connected' && !network.sessionExpired && !network.sessionReplaced;
    const participants = network.mode === 'online' ? network.room?.players.map(member => ({ ...member,
        connected: member.connected && (member.id !== network.playerId || connected) })) ?? []
        : localRoster.filter(member => players.some(player => player.color === member.color)).map(member => ({ ...member, id: `local-${member.color}`, connected: true, isBot: local.mode === 'bots' && member.color !== local.humanColor,
            name: member.color === local.humanColor && playerName.trim() ? playerName.trim() : getCharacter(member.characterId).title }));
    const connectionPause = gamePhase === 'playing' && !gameOver && (!connected || network.room?.paused) ? notice : null;
    const { canRoll } = useSelector(selectActionFlags);
    const isMyTurn = canControl;
    const tableRef = useRef(null);
    const appRef = useRef(null);
    const fullscreen = useGameFullscreen(appRef, showTable && gamePhase === 'playing');
    const releaseOrigins = useRef(new Map());
    const sound = useGameSounds({ game, scope: `${network.mode}:${network.room?.code ?? ''}`, releaseOrigins,
        musicActive: !(showTable && gamePhase === 'playing') && network.recoveryStatus === 'ready',
        active: showTable && gamePhase === 'playing' && (network.mode === 'local' || connected) });
    const motion = usePieceMotion({ game, tableRef, releaseOrigins, scope: `${network.mode}:${network.room?.code ?? ''}` });
    const interaction = usePieceInteraction({ game, canControl, tableRef, releaseOrigins, onReturn: motion.returnDrag,
        onAction: move => dispatch(move.action === 'place' ? placePiece(move.index) : movePiece({ tileIndex: move.piece.tile, pieceIndex: move.index })) });
    const [rulesOpen, setRulesOpen] = useState(false);
    const [visualTheme, setVisualTheme] = useVisualTheme();
    const [menuOpen, setMenuOpen] = useState(false);
    const [roomPanelOpen, setRoomPanelOpen] = useState(false);
    const [tutorialOpen, setTutorialOpen] = useState(false);
    const [tutorialPrompt, setTutorialPrompt] = useState(false);
    const [startAfterTutorial, setStartAfterTutorial] = useState(false);
    useEffect(() => { savePlayerProfile(profile); }, [profile]);
    useLocalBots({ game, enabled: network.mode === 'local' && showTable && local.mode === 'bots' && !local.paused && !menuOpen && !rulesOpen && !tutorialOpen, humanColor: local.humanColor });
    const myId = network.mode === 'online' ? network.playerId : `local-${local.humanColor}`;
    const myColor = participants.find(member => member.id === myId)?.color;
    const mobileFocusColor = gameOver ? myColor ?? loser : currentPlayerColor;
    const mobilePlayer = players.find(player => player.color === mobileFocusColor);
    const onlinePhase = network.mode === 'online' ? network.room?.phase ?? 'connecting' : invited ? 'invited' : screen === 'playing' ? 'local' : screen === 'setup' ? 'choosing' : 'menu';
    const paused = Boolean(connectionPause);
    const turnColor = loser ?? currentPlayerColor;
    const turnName = participants?.find(member => member.color === turnColor)?.name ?? PLAYER_THEMES[turnColor].name;
    const showRoomPanel = roomPanelOpen || (!paused && Boolean(network.error))
        || network.recoveryStatus !== 'ready' || (gamePhase !== 'playing' && Boolean(network.room?.paused));
    useEffect(() => {
        setRoomPanelOpen(false);
        if (network.mode === 'online') window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }, [network.mode, network.room?.phase]);
    useEffect(() => {
        if (network.mode === 'local') {
            setScreen('menu'); setSetupMode(null);
            if (previousNetworkMode.current === 'online') {
                const url = new URL(window.location.href); url.searchParams.delete('room');
                window.history.replaceState(window.history.state, '', url); setInviteCode('');
            }
        }
        previousNetworkMode.current = network.mode;
    }, [network.mode]);
    useEffect(() => {
        if (!menuOpen) return;
        const escape = event => { if (event.key === 'Escape') setMenuOpen(false); };
        window.addEventListener('keydown', escape);
        return () => window.removeEventListener('keydown', escape);
    }, [menuOpen]);

    const handleRollDice = () => {
        if (!showTable || !canRoll || isRolling || gameOver) return;
        interaction.clearSelection();
        dispatch(rollDice());
    };
    const handleReset = (activeColors = players.map(player => player.color)) => {
        setMenuOpen(false);
        interaction.clearSelection();
        dispatch(resetGame(activeColors));
    };
    const handleCharacterChange = id => {
        setCharacterId(id);
        setLocalRoster(roster => selectLocalCharacter(roster, id));
    };
    const startLocalParty = () => {
        if (!characterId || (setupMode !== 'bots' && setupMode !== 'manual')) return;
        handleReset(localRoster.slice(0, setupMode === 'bots' ? botCount + 1 : 4).map(seat => seat.color));
        dispatch(startLocalGame({ mode: setupMode, botCount, humanColor: profile.color, playerName: playerName.trim(), characterId }));
        setScreen('playing');
        setRoomPanelOpen(false);
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    };
    const handleStartLocal = () => {
        if (!profile.tutorialPromptSeen) setTutorialPrompt(true); else startLocalParty();
    };
    const handleOpenMenu = () => {
        if (network.mode === 'online') dispatch({ type: 'online/leave' });
        if (invited && network.mode === 'local') {
            const url = new URL(window.location.href); url.searchParams.delete('room');
            window.history.replaceState(window.history.state, '', url); setInviteCode('');
        }
        dispatch(pauseLocalGame()); interaction.clearSelection();
        setScreen('menu'); setRoomPanelOpen(false); setMenuOpen(false);
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    };
    const handleChooseMode = mode => {
        dispatch(pauseLocalGame());
        setSetupMode(mode); setScreen('setup'); setMenuOpen(false);
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    };

    return (
        <div className="App" ref={appRef} style={tableStyle(participants)} data-mobile-fullscreen={String(fullscreen.active)} data-fitted-table={String(fullscreen.fitted)} data-fullscreen-native={String(fullscreen.native)} data-theme={visualTheme} data-current-player={currentPlayerColor} data-winners={winners.join(',')} data-loser={loser ?? ''}
            data-online-phase={onlinePhase} data-game-mode={network.mode === 'online' ? 'online' : local.mode ?? ''} data-room-panel-open={String(showRoomPanel)} data-connection-pause={String(paused)}>
            <div className="table-atmosphere" aria-hidden="true">
                <div className="table-cloth cloth-green" /><div className="table-cloth cloth-red" />
                <div className="table-candle"><span className="candle-flame" /></div>
                <div className="table-coins"><span>♣</span><span>♦</span><span>♠</span></div>
                <div className="table-deck"><Fleur /></div>
            </div>
            {menuOpen && <button className="mobile-menu-backdrop" type="button" aria-label="Закрыть меню" onClick={() => setMenuOpen(false)} />}
            <header className="table-header">
                <div className="game-brand"><Fleur /><PrisonEmblem /><div><h1>Мандавошка</h1><p>{network.mode === 'online' && network.room
                    ? `Онлайн · ${players.length} ${players.length === 1 ? 'игрок' : 'игрока'}` : invited ? 'Партия для 2–4 игроков'
                    : visualTheme === 'prison' ? 'Четыре камеры. Один путь домой.' : 'Четыре масти. Одна партия.'}</p></div></div>
                {showTable && gamePhase === 'playing' && <div className="table-turn-status" data-player-color={turnColor}
                    role="status" aria-live="polite" aria-atomic="true" style={playerStyle(turnColor)}>
                    <span className="table-turn-suit" aria-hidden="true">{PLAYER_THEMES[turnColor].suit}</span>
                    <div><span className="table-turn-label">{gameOver ? 'Партия завершена' : paused ? 'Пауза. Очередь:' : 'Сейчас ходит:'}</span>
                        <strong title={turnName}>{gameOver ? `Не успел: ${turnName}` : turnName}</strong></div>
                </div>}
                <button type="button" className="mobile-menu-toggle" aria-label="Меню игры" aria-controls="game-settings" aria-expanded={menuOpen} onClick={() => setMenuOpen(open => !open)}><span aria-hidden="true">{menuOpen ? '×' : '☰'}</span></button>
                <nav id="game-settings" className={`table-navigation ${menuOpen ? 'is-open' : ''}`} aria-label="Меню игры">
                    <ThemeSwitcher theme={visualTheme} onChange={theme => { setVisualTheme(theme); setMenuOpen(false); }} />
                    <SoundSettings sound={sound} navigationOpen={menuOpen} />
                    {showTable && gamePhase === 'playing' && <FullscreenButton active={fullscreen.active} pending={fullscreen.pending} disabled={Boolean(interaction.drag)}
                        onToggle={() => { setMenuOpen(false); setRoomPanelOpen(false); void fullscreen.toggle(); }} />}
                    {network.mode === 'online' && <button type="button" className="button button-quiet open-room" aria-controls="online-panel" aria-expanded={roomPanelOpen}
                        onClick={() => { setRoomPanelOpen(open => !open); setMenuOpen(false); }}>Комната</button>}
                    <button type="button" className="button button-quiet open-rules" onClick={() => { setRulesOpen(true); setMenuOpen(false); }}>Правила</button>
                    <button type="button" className="button button-quiet open-tutorial" onClick={() => { setStartAfterTutorial(false); setTutorialOpen(true); setMenuOpen(false); }}>Как играть</button>
                    {showTable && <button type="button" className="button button-quiet open-game-menu" onClick={handleOpenMenu}>{network.mode === 'online' ? 'Выйти в главное меню' : 'Главное меню'}</button>}
                    {showTable && <button type="button" className="button button-quiet reset-game" disabled={!canRestart} onClick={() => handleReset()}><span aria-hidden="true">↻</span> Новая партия</button>}
                </nav>
            </header>
            {notice && <div className={`online-presence is-${notice.kind}`} role={notice.kind === 'warning' ? 'alert' : 'status'}>
                <span className="online-presence-icon" aria-hidden="true">{notice.kind === 'warning' ? '!' : '✓'}</span>
                <div><strong>{notice.title}</strong><p>{notice.description}</p></div>
                {notice.canRetry && <button type="button" className="button button-secondary reconnect-room" onClick={() => dispatch({ type: 'online/reconnect' })}>Подключиться сейчас</button>}
            </div>}
            {!networkScreen && screen === 'menu' && <GameMenu onChoose={handleChooseMode} canContinue={local.active}
                sound={sound} mode={local.mode} onContinue={() => { dispatch(resumeLocalGame()); setScreen('playing'); }} />}
            {!networkScreen && screen === 'setup' && setupMode !== 'online' && <LocalGameSetup mode={setupMode} botCount={botCount} onBotCountChange={setBotCount} characterId={characterId} onCharacterChange={handleCharacterChange}
                name={playerName} onNameChange={setPlayerName} color={profile.color} onColorChange={color => { setProfile(value => ({ ...value,color })); setLocalRoster(roster => selectLocalColor(roster,color)); }}
                roster={localRoster.slice(0, setupMode === 'bots' ? botCount + 1 : 4)} onRandomize={() => setLocalRoster(createLocalRoster(characterId, profile.color))}
                onRosterChange={(color, id) => setLocalRoster(roster => selectLocalCharacter(roster, id, color))}
                onStart={handleStartLocal} onBack={handleOpenMenu} />}
            {(networkScreen || (screen === 'setup' && setupMode === 'online')) && <MultiplayerPanel characterId={characterId} onCharacterChange={handleCharacterChange}
                name={playerName} onNameChange={setPlayerName} onBack={handleOpenMenu} />}
            {showTable && <main className="game-table" aria-label="Партия Мандавошки" data-player-count={players.length} ref={tableRef} {...interaction.pointerHandlers}>
                <MobilePlayers players={players} pieces={pieces} currentPlayerColor={currentPlayerColor} participants={participants}
                    tiles={game.tiles} prisonTileIndex={game.prisonTileIndex} phase={gamePhase} paused={paused} winners={winners} loser={loser} />
                <MobileHand player={mobilePlayer} pieces={pieces[mobileFocusColor]} tiles={game.tiles} prisonTileIndex={game.prisonTileIndex} interaction={interaction} />
                {players.map((player) => {
                    const member = participants?.find(participant => participant.color === player.color);
                    return (
                        <PlayerCard key={player.color} player={player} pieces={pieces[player.color]}
                            currentPlayerColor={currentPlayerColor} tiles={game.tiles}
                            prisonTileIndex={game.prisonTileIndex} won={winners.includes(player.color)} lost={loser === player.color} gameOver={gameOver} interaction={interaction}
                            isMyTurn={isMyTurn} isRolling={isRolling} canRoll={canRoll} phase={gamePhase} paused={paused}
                            displayName={member?.name} characterId={member?.characterId} connected={member?.connected ?? true} isMe={member?.id === myId} isBot={member?.isBot} />
                    );
                })}
                <BoardViewport onLayoutChange={motion.refreshPositions}>
                <GameBoard
                    onTileClick={interaction.onTileClick} interaction={interaction}
                    selectedTileIndex={interaction.selectedTileIndex} movableTileIndexes={movableTileIndexes} visualTheme={visualTheme}
                    canRoll={canRoll} onRoll={handleRollDice} isRolling={isRolling} canSkip={canControl}
                    connectionPause={connectionPause} onReconnect={() => dispatch({ type: 'online/reconnect' })}
                    results={gameOver && <GameResults winners={winners} loser={loser} participants={participants} canRestart={canRestart} onRestart={handleReset} />}
                    onSkip={() => dispatch({ ...finishDiceRoll(game.diceRoll?.id), meta: { skipAnimation: true } })}
                />
                </BoardViewport>
                <div ref={motion.layerRef} className="piece-motion-layer" aria-hidden="true" />
                {interaction.drag && <span className="piece piece-drag" aria-hidden="true" data-drag-state={interaction.drag.phase}
                    style={{ ...playerStyle(interaction.drag.color), width: interaction.drag.size, height: interaction.drag.size,
                        transform: `translate3d(${interaction.drag.x - interaction.drag.size / 2}px, ${interaction.drag.y - interaction.drag.size / 2 - 8}px, 0) scale(1.12)` }} />}
            </main>}
            <PieceChooser interaction={interaction} tiles={game.tiles} prisonTileIndex={game.prisonTileIndex} />
            <GameDialog open={tutorialPrompt} title="Показать, как играть?" onClose={() => setTutorialPrompt(false)} className="tutorial-prompt">
                <p className="tutorial-copy">Четыре коротких примера: кубики, фишки, клетки и победа.</p><div className="tutorial-prompt-actions">
                    <button type="button" className="button button-primary show-tutorial" onClick={() => { setProfile(value => ({ ...value,tutorialPromptSeen:true })); setTutorialPrompt(false); setStartAfterTutorial(true); setTutorialOpen(true); }}>Пройти обучение</button>
                    <button type="button" className="button button-quiet skip-tutorial" onClick={() => { setProfile(value => ({ ...value,tutorialPromptSeen:true })); setTutorialPrompt(false); startLocalParty(); }}>Сразу играть</button>
                </div>
            </GameDialog>
            <TutorialDialog open={tutorialOpen} onClose={() => { setTutorialOpen(false); setStartAfterTutorial(false); }} onComplete={() => {
                setProfile(value => ({ ...value,tutorialCompleted:true,tutorialPromptSeen:true })); setTutorialOpen(false); setStartAfterTutorial(false);
                if (startAfterTutorial) startLocalParty();
            }} />
            <RulesDialog open={rulesOpen} onClose={() => setRulesOpen(false)} />
        </div>
    );
};

export default App;
