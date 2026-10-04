import { useCallback, useEffect, useRef, useState } from 'react';
import { MOBILE_VIEWPORT_QUERY } from '../../shared/mobileViewport.js';

const fullscreenElement = () => document.fullscreenElement || document.webkitFullscreenElement;

export const useGameFullscreen = (root, enabled) => {
    const [mode, setMode] = useState('none');
    const [pending, setPending] = useState(false);
    const [landscape, setLandscape] = useState(() => window.matchMedia('(orientation: landscape)').matches);
    const [mobileViewport, setMobileViewport] = useState(() => window.matchMedia(MOBILE_VIEWPORT_QUERY).matches);
    const orientationLocked = useRef(false);
    const active = mode !== 'none';
    const fitted = enabled && (active || mobileViewport);
    const releaseOrientation = useCallback(() => {
        if (!orientationLocked.current) return;
        orientationLocked.current = false;
        try { window.screen.orientation?.unlock?.(); } catch { /* The browser may have already unlocked it. */ }
    }, []);
    const exit = useCallback(async () => {
        setMode('none'); releaseOrientation();
        if (fullscreenElement() !== root.current) return;
        const close = document.exitFullscreen || document.webkitExitFullscreen;
        try { await close?.call(document); }
        catch { if (fullscreenElement() === root.current) setMode('native'); }
    }, [root, releaseOrientation]);
    useEffect(() => {
        const update = () => {
            if (fullscreenElement() === root.current) setMode('native');
            else setMode(previous => previous === 'native' ? 'none' : previous);
        };
        document.addEventListener('fullscreenchange', update);
        document.addEventListener('webkitfullscreenchange', update);
        return () => {
            document.removeEventListener('fullscreenchange', update);
            document.removeEventListener('webkitfullscreenchange', update);
            releaseOrientation();
        };
    }, [root, releaseOrientation]);
    useEffect(() => {
        const orientation = window.matchMedia('(orientation: landscape)');
        const mobile = window.matchMedia(MOBILE_VIEWPORT_QUERY);
        const update = () => {
            setLandscape(orientation.matches);
            setMobileViewport(mobile.matches);
            if (!mobile.matches) void exit();
        };
        const queries = [orientation, mobile];
        update(); queries.forEach(query => query.addEventListener('change', update));
        return () => queries.forEach(query => query.removeEventListener('change', update));
    }, [exit]);
    useEffect(() => {
        const element = root.current;
        const update = () => element?.style.setProperty('--game-viewport-height', `${window.visualViewport?.height ?? window.innerHeight}px`);
        update();
        window.addEventListener('resize', update);
        window.visualViewport?.addEventListener('resize', update);
        return () => { window.removeEventListener('resize', update); window.visualViewport?.removeEventListener('resize', update); };
    }, [root]);
    useEffect(() => { if (!enabled) void exit(); }, [enabled, exit]);
    useEffect(() => { if (!active) releaseOrientation(); }, [active, releaseOrientation]);
    useEffect(() => {
        if (!fitted) return;
        const bodyOverflow = document.body.style.overflow, htmlOverflow = document.documentElement.style.overflow;
        const scrollX = window.scrollX, scrollY = window.scrollY;
        document.body.style.overflow = 'hidden'; document.documentElement.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = bodyOverflow; document.documentElement.style.overflow = htmlOverflow;
            window.scrollTo({ left: scrollX, top: scrollY, behavior: 'instant' });
        };
    }, [fitted]);
    useEffect(() => {
        if (!active) return;
        const escape = event => {
            if (event.key === 'Escape' && !fullscreenElement() && !event.defaultPrevented
                && !root.current?.querySelector('dialog[open], .table-navigation.is-open')) void exit();
        };
        window.addEventListener('keydown', escape);
        return () => window.removeEventListener('keydown', escape);
    }, [active, root, exit]);
    const enter = async () => {
        if (!enabled || pending || !root.current) return;
        const element = root.current;
        setMode('immersive'); setPending(true);
        const request = element.requestFullscreen || element.webkitRequestFullscreen;
        try {
            if (request) await request.call(element, { navigationUI: 'hide' });
        } catch { /* Keep the fitted game view when native fullscreen is unavailable. */ }
        finally { setPending(false); }
        if (fullscreenElement() !== element) return;
        setMode('native');
        try {
            if (window.screen.orientation?.lock) {
                await window.screen.orientation.lock('landscape');
                orientationLocked.current = true;
                if (fullscreenElement() !== element) releaseOrientation();
            }
        } catch { /* Manual rotation remains available. */ }
    };
    return { active, fitted, native: mode === 'native', pending, landscape, toggle: active ? exit : enter };
};
