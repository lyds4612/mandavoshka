import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createAudioEngine } from './audioEngine.js';
import { getGameSoundEvents } from './gameSoundEvents.js';
import { getDiceSoundEvents } from './diceSoundEvents.js';
import menuMusicUrl from '../assets/menu-table.mp3';

const STORAGE_KEY = 'mandavoshka.sound.v1';
const SETTINGS_KEY = 'mandavoshka.audio.v2';
const clampVolume = value => Math.max(0, Math.min(100, Math.round(value)));
const readSettings = () => {
    let saved = {}, enabled = true;
    try { enabled = localStorage.getItem(STORAGE_KEY) !== 'off'; saved = JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}; } catch { /* Default settings work without storage. */ }
    const volume = key => typeof saved[key] === 'number' && Number.isFinite(saved[key]) ? clampVolume(saved[key]) : key === 'volume' ? 70 : 40;
    return { enabled: typeof saved.enabled === 'boolean' ? saved.enabled : enabled, volume: volume('volume'),
        musicEnabled: typeof saved.musicEnabled === 'boolean' ? saved.musicEnabled : true, musicVolume: volume('musicVolume') };
};

export const useGameSounds = ({ game, scope, active, musicActive, releaseOrigins }) => {
    const [settings, setSettings] = useState(readSettings);
    const settingsRef = useRef(settings);
    const [musicStatus, setMusicStatus] = useState('idle');
    const engine = useMemo(() => createAudioEngine({ musicUrl: menuMusicUrl, onMusicState: setMusicStatus }), []);
    const previous = useRef(null);
    const applySettings = next => {
        engine.setVolume(next.volume / 100);
        engine.setMusicVolume(next.musicEnabled ? next.musicVolume / 100 : 0);
        engine.setEnabled(next.enabled);
    };
    const updateSettings = patch => {
        const next = { ...settingsRef.current, ...patch };
        settingsRef.current = next; applySettings(next); engine.unlock({ userGesture: true }); setSettings(next);
    };
    useEffect(() => {
        engine.setVolume(settings.volume / 100);
        engine.setMusicVolume(settings.musicEnabled ? settings.musicVolume / 100 : 0);
        engine.setEnabled(settings.enabled);
        try { localStorage.setItem(STORAGE_KEY, settings.enabled ? 'on' : 'off'); localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch { /* A restricted store does not affect play. */ }
    }, [engine, settings]);
    useEffect(() => { engine.setMenuMusic(musicActive); }, [engine, musicActive]);
    useEffect(() => {
        const unlock = event => engine.unlock({ userGesture: Boolean(event?.isTrusted && event.type !== 'focus') });
        const hide = () => engine.visibilityChanged();
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
            if (before.game.diceRoll?.id !== game.diceRoll?.id || (before.game.isRolling && !game.isRolling)) engine.stop('dice');
            const diceEvents = getDiceSoundEvents(before.game, game);
            if (diceEvents.length) engine.play(diceEvents, 'dice');
            const player = before.game.players[before.game.currentPlayerIndex];
            const dragged = before.game.pieces[player.color].some((_, index) => releaseOrigins.current.has(`${player.color}-${index}`));
            const events = getGameSoundEvents(before.game, game, { dragged });
            if (events.length) engine.play(events);
        } else engine.stop();
        previous.current = { game, scope, active };
    }, [game, scope, active, engine, releaseOrigins]);
    return {
        ...settings, musicStatus,
        setVolume: value => updateSettings({ volume: clampVolume(value), ...(value > 0 ? { enabled: true } : {}) }),
        setMusicVolume: value => updateSettings({ musicVolume: clampVolume(value), ...(value > 0 ? { musicEnabled: true } : {}) }),
        toggleMusic: () => updateSettings({ musicEnabled: !(settingsRef.current.musicEnabled && settingsRef.current.musicVolume > 0),
            ...(!settingsRef.current.musicVolume ? { musicVolume: 40 } : {}) }),
        retryMusic: () => { engine.unlock({ userGesture: true }); engine.retryMusic(); },
        toggle: () => {
            const next = settingsRef.current;
            updateSettings({ enabled: !(next.enabled && next.volume > 0), ...(!next.volume ? { volume: 70 } : {}) });
        },
    };
};
