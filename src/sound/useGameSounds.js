import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createAudioEngine } from './audioEngine.js';
import { getGameSoundEvents } from './gameSoundEvents.js';
import { getDiceSoundEvents } from './diceSoundEvents.js';

const STORAGE_KEY = 'mandavoshka.sound.v1';

export const useGameSounds = ({ game, scope, active, releaseOrigins }) => {
    const [enabled, setEnabled] = useState(() => {
        try { return localStorage.getItem(STORAGE_KEY) !== 'off'; } catch { return true; }
    });
    const engine = useMemo(createAudioEngine, []);
    const previous = useRef(null);
    useEffect(() => {
        engine.setEnabled(enabled);
        try { localStorage.setItem(STORAGE_KEY, enabled ? 'on' : 'off'); } catch { /* A restricted store does not affect play. */ }
    }, [engine, enabled]);
    useEffect(() => {
        const unlock = () => engine.unlock();
        const hide = () => { if (document.hidden) engine.stop(); else engine.unlock(); };
        const gestures = ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown'];
        gestures.forEach(type => window.addEventListener(type, unlock, { capture: true, passive: true }));
        window.addEventListener('focus', unlock);
        document.addEventListener('visibilitychange', hide);
        return () => {
            gestures.forEach(type => window.removeEventListener(type, unlock, true));
            window.removeEventListener('focus', unlock);
            document.removeEventListener('visibilitychange', hide); engine.dispose();
        };
    }, [engine]);
    useLayoutEffect(() => {
        const before = previous.current;
        if (active && before?.active && before.scope === scope && game.rollCount > 0) {
            const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (before.game.diceRoll?.id !== game.diceRoll?.id || (before.game.isRolling && !game.isRolling)) engine.stop('dice');
            const diceEvents = getDiceSoundEvents(before.game, game, { reducedMotion });
            if (diceEvents.length) engine.play(diceEvents, 'dice');
            const player = before.game.players[before.game.currentPlayerIndex];
            const dragged = before.game.pieces[player.color].some((_, index) => releaseOrigins.current.has(`${player.color}-${index}`));
            const events = getGameSoundEvents(before.game, game, { dragged, reducedMotion });
            if (events.length) engine.play(events);
        } else engine.stop();
        previous.current = { game, scope, active };
    }, [game, scope, active, engine, releaseOrigins]);
    return {
        enabled,
        toggle: () => {
            const value = !enabled;
            engine.setEnabled(value);
            if (value) engine.unlock();
            setEnabled(value);
        },
    };
};
