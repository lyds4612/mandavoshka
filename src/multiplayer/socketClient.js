import { io } from 'socket.io-client';
import { nanoid } from '@reduxjs/toolkit';
import { getInvitationCode } from './invitation.js';
import { readSavedSessions, saveRecoverySession, forgetRecoverySession, retainRecoverySessions } from './savedSessions.js';
import { receiveRemoteState, resetGame } from '../store/gameSlice.js';
import {
    connectionStatus, restoringSession, sessionJoined, roomReceived,
    requestPending, networkError, returnToLocal,
    reconnecting, sessionReplaced, sessionExpired, recoveryLoading, recoveryFinished, recoveryFailed,
} from '../store/multiplayerSlice.js';

const SESSION_KEY = 'mandavoshka.online.session.v1';
const readSession = () => {
    try {
        const value = JSON.parse(window.sessionStorage.getItem(SESSION_KEY));
        if (!value || typeof value.token !== 'string' || !/^[A-Z2-9]{6}$/.test(value.roomCode)) return null;
        const inviteCode = getInvitationCode();
        if (inviteCode) {
            const entrySession = window.history.state?.[SESSION_KEY];
            const isReload = window.performance.getEntriesByType('navigation')[0]?.type === 'reload';
            // Opening an invite can copy the opener's sessionStorage. Only this
            // tab's existing history entry, or a refresh, may restore that seat.
            if (inviteCode !== value.roomCode || (entrySession?.playerId !== value.playerId && !isReload)) {
                persistSession(null);
                return null;
            }
        }
        return value;
    } catch { return null; }
};
const persistSession = session => {
    try { if (session) window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session)); else window.sessionStorage.removeItem(SESSION_KEY); } catch { /* Play also works without persistent browser storage. */ }
    try {
        const state = { ...window.history.state };
        if (session) state[SESSION_KEY] = { playerId: session.playerId, roomCode: session.roomCode };
        else delete state[SESSION_KEY];
        window.history.replaceState(state, '', window.location.href);
    } catch { /* A restricted history API must not prevent joining. */ }
};

export const multiplayerMiddleware = api => {
    let socket = null;
    let session = readSession();
    let generation = 0;
    let catalogRequest = 0;
    let recoveryTimer = null;
    let checkingRecovery = false;
    let automaticRecovery = true;
    const applySnapshot = snapshot => {
        if (!session || !snapshot || snapshot.code !== session.roomCode) return;
        const current = api.getState().multiplayer.room;
        if (current?.code === snapshot.code && current.revision > snapshot.revision) return;
        api.dispatch(roomReceived(snapshot));
        api.dispatch(receiveRemoteState(snapshot.game));
    };
    const request = async (event, payload) => {
        if (!socket?.connected) throw new Error('Нет связи с сервером. Дождитесь переподключения.');
        const result = await socket.timeout(6000).emitWithAck(event, payload);
        if (result.snapshot) applySnapshot(result.snapshot);
        if (!result.ok) throw Object.assign(new Error(result.error?.message ?? 'Сервер отклонил запрос.'), { code: result.error?.code });
        return result;
    };
    const adoptSession = result => {
        clearTimeout(recoveryTimer);
        session = result.session; persistSession(session);
        saveRecoverySession(session);
        api.dispatch(sessionJoined({ playerId: session.playerId, inviteOrigin: result.inviteOrigin }));
        applySnapshot(result.snapshot);
    };
    const reportResumeError = (error, saved, resumeGeneration) => {
        if (generation !== resumeGeneration) return;
        if (['BAD_SESSION', 'ROOM_NOT_FOUND'].includes(error.code)) {
            forgetRecoverySession(saved.playerId);
            if (session?.playerId === saved.playerId) {
                persistSession(null); session = null; api.dispatch(sessionExpired());
            }
            if (api.getState().multiplayer.mode === 'local') refreshRecoveries();
        }
        if (api.getState().multiplayer.mode === 'online') api.dispatch(connectionStatus('error'));
        api.dispatch(networkError(error.message));
    };
    const ensureSocket = () => {
        if (socket) return socket;
        socket = io(process.env.REACT_APP_SOCKET_URL || undefined, { autoConnect: false, reconnection: true,
            reconnectionDelay: 500, reconnectionDelayMax: 3000, randomizationFactor: .25, timeout: 6000,
            closeOnBeforeunload: true });
        socket.on('room:state', applySnapshot);
        socket.io.on('reconnect_attempt', attempt => { if (session) api.dispatch(reconnecting(attempt)); });
        socket.on('connect', async () => {
            if (!session) {
                const network = api.getState().multiplayer;
                api.dispatch(connectionStatus(network.mode === 'online' ? 'error' : 'connected'));
                refreshRecoveries();
                return;
            }
            const connectionGeneration = generation;
            const savedSession = session;
            api.dispatch(api.getState().multiplayer.room ? reconnecting() : connectionStatus('connecting'));
            try {
                const result = await request('room:resume', { code: savedSession.roomCode, token: savedSession.token, pageOrigin: window.location.origin });
                if (generation === connectionGeneration) adoptSession(result);
            } catch (error) { reportResumeError(error, savedSession, connectionGeneration); }
        });
        socket.on('disconnect', reason => {
            generation += 1;
            catalogRequest += 1;
            const replaced = api.getState().multiplayer.sessionReplaced;
            api.dispatch(session && !replaced ? reconnecting() : connectionStatus('disconnected'));
            api.dispatch(requestPending(false));
            if (!session && api.getState().multiplayer.mode === 'local') api.dispatch(readSavedSessions().length ? recoveryFailed() : recoveryFinished());
            if (reason === 'io server disconnect' && session && !replaced) {
                const reconnectGeneration = generation;
                setTimeout(() => { if (generation === reconnectGeneration && session) socket?.connect(); }, 500);
            }
        });
        socket.on('connect_error', () => {
            generation += 1;
            if (session) api.dispatch(reconnecting());
            else {
                api.dispatch(connectionStatus('disconnected'));
                if (api.getState().multiplayer.pending) api.dispatch(networkError('Не удалось подключиться к серверу игры. Проверьте соединение.'));
            }
            api.dispatch(requestPending(false));
        });
        socket.on('session:replaced', () => {
            api.dispatch(sessionReplaced());
            api.dispatch(networkError('Это место открыто в другом окне. Выйдите из комнаты, чтобы начать новую партию.'));
        });
        return socket;
    };
    const connect = () => new Promise((resolve, reject) => {
        const client = ensureSocket();
        if (client.connected) { resolve(); return; }
        api.dispatch(connectionStatus('connecting'));
        const cleanup = () => { clearTimeout(timer); client.off('connect', connected); client.off('connect_error', failed); };
        const connected = () => { cleanup(); resolve(); };
        const failed = () => { cleanup(); reject(new Error('Сервер игры недоступен. Запустите сервер или попробуйте позже.')); };
        const timer = setTimeout(failed, 6000);
        client.once('connect', connected); client.once('connect_error', failed); client.connect();
    });
    const perform = async callback => {
        if (api.getState().multiplayer.pending) return;
        const currentGeneration = generation;
        api.dispatch(requestPending(true));
        try { await callback(currentGeneration); }
        catch (error) { if (currentGeneration === generation) api.dispatch(networkError(error.message || 'Не удалось получить ответ сервера.')); }
        finally { if (currentGeneration === generation) api.dispatch(requestPending(false)); }
    };
    const clearConnection = () => {
        generation += 1;
        catalogRequest += 1;
        clearTimeout(recoveryTimer);
        if (session && !api.getState().multiplayer.sessionReplaced) forgetRecoverySession(session.playerId);
        automaticRecovery = false;
        session = null; persistSession(null);
        socket?.io.removeAllListeners(); socket?.removeAllListeners(); socket?.disconnect(); socket = null;
        api.dispatch(returnToLocal()); api.dispatch(resetGame());
        api.dispatch(recoveryFinished());
    };
    const refreshRecoveries = async () => {
        clearTimeout(recoveryTimer);
        if (session || api.getState().multiplayer.mode !== 'local' || api.getState().multiplayer.pending || checkingRecovery) return;
        const records = readSavedSessions();
        if (!automaticRecovery || !records.length) { api.dispatch(recoveryFinished()); return; }
        const requestId = ++catalogRequest;
        checkingRecovery = true;
        api.dispatch(recoveryLoading());
        try {
            await connect();
            const result = await request('room:recover', { sessions: records.map(record => ({ code: record.roomCode, token: record.token })) });
            if (requestId !== catalogRequest || session || api.getState().multiplayer.mode !== 'local') return;
            retainRecoverySessions(result.sessions);
            const inviteCode = getInvitationCode();
            const relevant = result.sessions.filter(record => !inviteCode || record.roomCode === inviteCode);
            // A new invite window must not take the active seat of its opener.
            // Normal reopening restores the most recently used identity, even
            // when the old transport has not reported its closure yet.
            const returning = relevant.find(record => !record.connected || !window.opener);
            if (returning) {
                const saved = records.find(record => record.playerId === returning.playerId);
                session = saved; persistSession(saved); api.dispatch(restoringSession());
                const resumeGeneration = generation;
                try {
                    const resumed = await request('room:resume', { code: saved.roomCode, token: saved.token, pageOrigin: window.location.origin });
                    if (generation === resumeGeneration) adoptSession(resumed);
                } catch (error) { reportResumeError(error, saved, resumeGeneration); }
            } else {
                api.dispatch(recoveryFinished());
                if (relevant.some(record => record.connected)) recoveryTimer = setTimeout(refreshRecoveries, 5000);
            }
        } catch {
            if (requestId === catalogRequest && !session && api.getState().multiplayer.mode === 'local') api.dispatch(recoveryFailed());
        } finally { checkingRecovery = false; }
    };
    const reconnect = () => {
        if (!session || api.getState().multiplayer.sessionReplaced) return;
        api.dispatch(reconnecting());
        if (socket?.connected) {
            const reconnectGeneration = generation;
            const savedSession = session;
            request('room:resume', { code: savedSession.roomCode, token: savedSession.token, pageOrigin: window.location.origin })
                .then(result => { if (generation === reconnectGeneration) adoptSession(result); })
                .catch(error => reportResumeError(error, savedSession, reconnectGeneration));
        } else ensureSocket().connect();
    };
    window.addEventListener('pagehide', () => socket?.disconnect());
    window.addEventListener('pageshow', event => { if (event.persisted) session ? reconnect() : refreshRecoveries(); });
    window.addEventListener('offline', () => { socket?.disconnect(); if (session) { api.dispatch(reconnecting()); api.dispatch(requestPending(false)); } });
    window.addEventListener('online', () => session ? reconnect() : refreshRecoveries());
    window.addEventListener('focus', () => { if (!session) refreshRecoveries(); });
    window.addEventListener('storage', event => { if (event.key === 'mandavoshka.online.recovery.v1' && !session) refreshRecoveries(); });
    setTimeout(() => {
        if (session) {
            const restoreGeneration = generation;
            api.dispatch(restoringSession());
            connect().catch(error => { if (generation === restoreGeneration) api.dispatch(networkError(error.message)); });
        } else refreshRecoveries();
    }, 0);

    const commands = { 'game/rollDice': 'roll', 'game/placePiece': 'place', 'game/movePiece': 'move', 'game/finishDiceRoll': 'skip' };
    return next => action => {
        if (action.type === 'online/create' || action.type === 'online/join') {
            return perform(async operationGeneration => {
                await connect();
                const result = await request(action.type === 'online/create' ? 'room:create' : 'room:join', { ...action.payload, pageOrigin: window.location.origin });
                if (generation === operationGeneration) adoptSession(result);
            });
        }
        if (action.type === 'online/reconnect') return reconnect();
        if (action.type === 'online/recover') return refreshRecoveries();
        if (action.type === 'online/resume') return perform(async operationGeneration => {
            const saved = readSavedSessions().find(record => record.playerId === action.payload.playerId && record.roomCode === action.payload.roomCode);
            if (!saved) throw new Error('Сохранённый вход не найден. Используйте прежний браузер.');
            await connect();
            try {
                const result = await request('room:resume', { code: saved.roomCode, token: saved.token, pageOrigin: window.location.origin });
                if (generation === operationGeneration) adoptSession(result);
            } catch (error) { reportResumeError(error, saved, operationGeneration); }
        });
        if (action.type === 'online/start') return perform(() => request('room:start', {}));
        if (action.type === 'online/leave') {
            return perform(async () => { try { if (socket?.connected && session) await request('room:leave', {}); } finally { clearConnection(); } });
        }
        const network = api.getState().multiplayer;
        if (network.mode === 'online' && action.type === 'game/resetGame') return perform(() => request('room:restart', {}));
        if (network.mode === 'online' && commands[action.type]) {
            // Renderer timers are local; the server alone finishes the shared throw.
            if (action.type === 'game/finishDiceRoll' && !action.meta?.skipAnimation) return;
            return perform(() => request('game:command', {
                id: nanoid(), revision: network.room?.revision,
                type: commands[action.type],
                ...(action.type === 'game/movePiece' ? typeof action.payload === 'object' ? action.payload : { tileIndex: action.payload } : {}),
                ...(action.type === 'game/placePiece' && action.payload !== undefined ? { pieceIndex: action.payload } : {}),
                ...(action.type === 'game/finishDiceRoll' ? { rollId: action.payload } : {}),
            }));
        }
        return next(action);
    };
};
