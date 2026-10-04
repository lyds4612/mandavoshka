import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { rollDice } from '../store/gameSlice.js';
import { hasPlayerFinished, isGameOver } from '../store/logic/gameRules.js';
import { chooseBotAction } from './chooseBotAction.js';

export const useLocalBots = ({ game, enabled, humanColor }) => {
    const dispatch = useDispatch();
    const workerRef = useRef(null), sequence = useRef(0);
    const [visible, setVisible] = useState(() => !document.hidden);
    useEffect(() => {
        const update = () => setVisible(!document.hidden);
        document.addEventListener('visibilitychange', update);
        return () => document.removeEventListener('visibilitychange', update);
    }, []);
    useEffect(() => {
        if (!enabled) { workerRef.current?.terminate(); workerRef.current = null; }
        return () => { workerRef.current?.terminate(); workerRef.current = null; };
    }, [enabled]);
    useEffect(() => {
        const player = game.players[game.currentPlayerIndex];
        if (!enabled || !visible || player.color === humanColor || game.isRolling || isGameOver(game) || hasPlayerFinished(game, player.color)) return;
        let cancelled = false;
        const id = ++sequence.current;
        const deliver = action => { if (!cancelled && action) dispatch(action); };
        const fallback = () => deliver(chooseBotAction(game));
        const timer = window.setTimeout(() => {
            if (game.canRoll) { deliver(rollDice()); return; }
            try {
                const worker = workerRef.current ?? new Worker(new URL('./bot.worker.js', import.meta.url));
                workerRef.current = worker;
                worker.onmessage = ({ data }) => {
                    if (cancelled || data.id !== id) return;
                    if (data.failed) fallback(); else deliver(data.action);
                };
                worker.onerror = event => {
                    event.preventDefault(); worker.terminate(); workerRef.current = null;
                    if (!cancelled) fallback();
                };
                worker.postMessage({ id, game });
            } catch { fallback(); }
        }, game.canRoll ? 950 : 800);
        return () => { cancelled = true; window.clearTimeout(timer); };
    }, [dispatch, game, enabled, humanColor, visible]);
};
