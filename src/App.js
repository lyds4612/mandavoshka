import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import './App.css';
import './themes/prison.css';
import GameBoard from './components/GameBoard';
import PlayerCard from './components/PlayerCard';
import RulesDialog from './components/RulesDialog';
import MultiplayerPanel from './components/MultiplayerPanel';
import MobilePlayers from './components/MobilePlayers';
import BoardViewport from './components/BoardViewport';
import { getInvitationCode } from './multiplayer/invitation.js';
import { getConnectionNotice } from './multiplayer/connectionNotice.js';
import { selectCanControlGame, selectCanRestart, selectMultiplayer } from './store/multiplayerSlice.js';
import { Fleur } from './components/Ornaments';
import ThemeSwitcher, { PrisonEmblem, useVisualTheme } from './components/ThemeSwitcher';
import { playerStyle } from './components/gamePresentation';
import { usePieceInteraction } from './components/pieces/usePieceInteraction';
import { usePieceMotion } from './components/pieces/usePieceMotion';
import './components/pieces/PieceInteraction.css';
import './components/BoardControls.css';
import './components/MobileGame.css';
import { finishDiceRoll, movePiece, placePiece, resetGame, rollDice } from './store/gameSlice';
import {
    selectActionFlags, selectCurrentPlayerColor, selectGameState, selectIsRolling,
    selectMovableTileIndexes, selectPieces, selectPlayers, selectWinner,
} from './store/selectors/gameSelectors';

const App = () => {
    const dispatch = useDispatch();
    const game = useSelector(selectGameState);
    const currentPlayerColor = useSelector(selectCurrentPlayerColor);
    const pieces = useSelector(selectPieces);
    const players = useSelector(selectPlayers);
    const movableTileIndexes = useSelector(selectMovableTileIndexes);
    const winner = useSelector(selectWinner);
    const isRolling = useSelector(selectIsRolling);
    const canControl = useSelector(selectCanControlGame);
    const canRestart = useSelector(selectCanRestart);
    const network = useSelector(selectMultiplayer);
    const invited = Boolean(getInvitationCode());
    const showTable = network.mode === 'online' ? Boolean(network.room) : !invited && network.recoveryStatus === 'ready';
    const gamePhase = network.mode === 'online' ? network.room?.phase : 'playing';
    const notice = getConnectionNotice(network);
    const connected = network.status === 'connected' && !network.sessionExpired && !network.sessionReplaced;
    const participants = network.room?.players.map(member => ({ ...member,
        connected: member.connected && (member.id !== network.playerId || connected) }));
    const connectionPause = gamePhase === 'playing' && (!connected || network.room?.paused) ? notice : null;
    const { canRoll } = useSelector(selectActionFlags);
    const isMyTurn = network.mode === 'local' || (network.room?.phase === 'playing'
        && network.room.players.find(player => player.id === network.playerId)?.color === currentPlayerColor);
    const tableRef = useRef(null);
    const releaseOrigins = useRef(new Map());
    const motion = usePieceMotion({ game, tableRef, releaseOrigins, scope: `${network.mode}:${network.room?.code ?? ''}` });
    const interaction = usePieceInteraction({ game, canControl, tableRef, releaseOrigins, onReturn: motion.returnDrag,
        onAction: move => dispatch(move.action === 'place' ? placePiece(move.index) : movePiece({ tileIndex: move.piece.tile, pieceIndex: move.index })) });
    const { selectedTileIndex } = interaction;
    const [rulesOpen, setRulesOpen] = useState(false);
    const [visualTheme, setVisualTheme] = useVisualTheme();
    const [menuOpen, setMenuOpen] = useState(false);
    const [roomPanelOpen, setRoomPanelOpen] = useState(false);
    const [boardZoomed, setBoardZoomed] = useState(false);
    const mobileFocusColor = winner ?? currentPlayerColor;
    const onlinePhase = network.mode === 'online' ? network.room?.phase ?? 'connecting' : invited ? 'invited' : 'local';
    const paused = Boolean(connectionPause);
    const showRoomPanel = roomPanelOpen || (!paused && Boolean(network.error))
        || network.recoveryStatus !== 'ready' || (gamePhase !== 'playing' && Boolean(network.room?.paused));
    useEffect(() => { setRoomPanelOpen(false); setBoardZoomed(false); }, [network.mode, network.room?.phase]);
    useEffect(() => { setBoardZoomed(false); }, [currentPlayerColor, isRolling]);
    useEffect(() => { if (paused) setBoardZoomed(false); }, [paused]);
    useEffect(() => {
        if (!menuOpen) return;
        const escape = event => { if (event.key === 'Escape') setMenuOpen(false); };
        window.addEventListener('keydown', escape);
        return () => window.removeEventListener('keydown', escape);
    }, [menuOpen]);

    const handleRollDice = () => {
        if (!canRoll || isRolling || winner) return;
        interaction.clearSelection();
        dispatch(rollDice());
    };
    const handleReset = () => {
        setMenuOpen(false);
        setBoardZoomed(false);
        interaction.clearSelection();
        dispatch(resetGame());
    };

    return (
        <div className="App" data-theme={visualTheme} data-current-player={currentPlayerColor} data-winner={winner ?? ''}
            data-online-phase={onlinePhase} data-room-panel-open={String(showRoomPanel)} data-connection-pause={String(paused)}>
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
                <button type="button" className="mobile-room-toggle" aria-controls="online-panel" aria-expanded={roomPanelOpen || onlinePhase === 'waiting'}
                    aria-label={network.mode === 'online' ? 'Открыть комнату' : 'Играть онлайн'} onClick={() => { setRoomPanelOpen(open => !open); setMenuOpen(false); }}>
                    {network.mode === 'online' && <span className="online-connection-dot" data-connected={connected} aria-hidden="true" />}
                    {network.room?.phase === 'playing' ? `${participants.filter(player => player.connected).length}/${participants.length}` : network.mode === 'online' ? 'Комната' : 'Онлайн'}
                </button>
                <button type="button" className="mobile-menu-toggle" aria-label="Меню игры" aria-controls="game-settings" aria-expanded={menuOpen} onClick={() => setMenuOpen(open => !open)}><span aria-hidden="true">{menuOpen ? '×' : '☰'}</span></button>
                <nav id="game-settings" className={`table-navigation ${menuOpen ? 'is-open' : ''}`} aria-label="Меню игры">
                    <ThemeSwitcher theme={visualTheme} onChange={theme => { setVisualTheme(theme); setMenuOpen(false); }} />
                    <button type="button" className="button button-quiet open-rules" onClick={() => { setRulesOpen(true); setMenuOpen(false); }}>Правила</button>
                    {showTable && <button type="button" className="button button-quiet reset-game" disabled={!canRestart} onClick={handleReset}><span aria-hidden="true">↻</span> Новая партия</button>}
                </nav>
            </header>
            {notice && <div className={`online-presence is-${notice.kind}`} role={notice.kind === 'warning' ? 'alert' : 'status'}>
                <span className="online-presence-icon" aria-hidden="true">{notice.kind === 'warning' ? '!' : '✓'}</span>
                <div><strong>{notice.title}</strong><p>{notice.description}</p></div>
                {notice.canRetry && <button type="button" className="button button-secondary reconnect-room" onClick={() => dispatch({ type: 'online/reconnect' })}>Подключиться сейчас</button>}
            </div>}
            <MultiplayerPanel expanded={roomPanelOpen} />
            {showTable && <main className="game-table" aria-label="Партия Мандавошки" data-player-count={network.mode === 'online' ? players.length : undefined} ref={tableRef} {...interaction.pointerHandlers}>
                <MobilePlayers players={players} pieces={pieces} currentPlayerColor={currentPlayerColor} participants={participants}
                    phase={gamePhase} zoomed={boardZoomed} onZoom={() => setBoardZoomed(zoomed => !zoomed)} zoomDisabled={isRolling || Boolean(interaction.drag) || paused} />
                {players.map((player) => {
                    const member = participants?.find(participant => participant.color === player.color);
                    return (
                        <PlayerCard key={player.color} player={player} pieces={pieces[player.color]}
                            currentPlayerColor={currentPlayerColor} tiles={game.tiles}
                            prisonTileIndex={game.prisonTileIndex} winner={winner} interaction={interaction}
                            isMyTurn={isMyTurn} isRolling={isRolling} canRoll={canRoll} phase={gamePhase}
                            mobileFocus={player.color === mobileFocusColor} boardZoomed={boardZoomed}
                            displayName={member?.name} connected={member?.connected ?? true} isMe={member?.id === network.playerId} />
                    );
                })}
                <BoardViewport zoomed={boardZoomed} onZoomChange={setBoardZoomed} onLayoutChange={motion.refreshPositions}
                    focusTileIndex={selectedTileIndex ?? interaction.targetTiles.at(-1) ?? players[game.currentPlayerIndex].start}>
                <GameBoard
                    onTileClick={interaction.onTileClick} interaction={interaction}
                    selectedTileIndex={selectedTileIndex} movableTileIndexes={movableTileIndexes} visualTheme={visualTheme}
                    canRoll={canRoll} onRoll={handleRollDice} isRolling={isRolling} canSkip={canControl}
                    connectionPause={connectionPause} onReconnect={() => dispatch({ type: 'online/reconnect' })}
                    onSkip={() => dispatch({ ...finishDiceRoll(game.diceRoll?.id), meta: { skipAnimation: true } })}
                />
                </BoardViewport>
                <div ref={motion.layerRef} className="piece-motion-layer" aria-hidden="true" />
                {interaction.drag && <span className="piece piece-drag" aria-hidden="true" data-drag-state={interaction.drag.phase}
                    style={{ ...playerStyle(interaction.drag.color), width: interaction.drag.size, height: interaction.drag.size,
                        transform: `translate3d(${interaction.drag.x - interaction.drag.size / 2}px, ${interaction.drag.y - interaction.drag.size / 2 - 8}px, 0) scale(1.12)` }} />}
            </main>}
            <RulesDialog open={rulesOpen} onClose={() => setRulesOpen(false)} />
        </div>
    );
};

export default App;
