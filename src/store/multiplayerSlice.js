import { createSlice } from '@reduxjs/toolkit';
import { hasPlayerFinished, isGameOver } from './logic/gameRules.js';

const initialState = { mode: 'local', status: 'idle', room: null, playerId: null, inviteOrigin: null, pending: false, error: '',
    reconnectAttempt: 0, sessionReplaced: false, sessionExpired: false, recoveryStatus: 'loading' };
const multiplayerSlice = createSlice({
    name: 'multiplayer', initialState,
    reducers: {
        connectionStatus(state, { payload }) { state.status = payload; },
        restoringSession(state) { state.mode = 'online'; state.status = 'connecting'; state.error = ''; },
        sessionJoined(state, { payload }) { state.mode = 'online'; state.playerId = payload.playerId; state.inviteOrigin = payload.inviteOrigin ?? null; state.status = 'connected'; state.error = ''; state.reconnectAttempt = 0; state.sessionReplaced = false; state.sessionExpired = false; state.recoveryStatus = 'ready'; },
        reconnecting(state, { payload }) { state.status = 'reconnecting'; state.reconnectAttempt = payload ?? state.reconnectAttempt; state.error = ''; },
        sessionReplaced(state) { state.sessionReplaced = true; },
        sessionExpired(state) { state.sessionExpired = true; },
        recoveryLoading(state) { state.recoveryStatus = 'loading'; },
        recoveryFinished(state) { state.recoveryStatus = 'ready'; },
        recoveryFailed(state) { state.recoveryStatus = 'error'; },
        roomReceived(state, { payload }) {
            const { game, ...room } = payload;
            state.room = room; state.error = '';
        },
        requestPending(state, { payload }) { state.pending = payload; if (payload) state.error = ''; },
        networkError(state, { payload }) { state.error = payload; state.pending = false; },
        returnToLocal() { return initialState; },
    },
});
export const { connectionStatus, restoringSession, sessionJoined, roomReceived, requestPending, networkError, returnToLocal,
    reconnecting, sessionReplaced, sessionExpired, recoveryLoading, recoveryFinished, recoveryFailed } = multiplayerSlice.actions;
export default multiplayerSlice.reducer;

export const selectMultiplayer = state => state.multiplayer;
export const selectIsOnline = state => state.multiplayer.mode === 'online';
export const canControlGame = state => {
    if (isGameOver(state.game)) return false;
    const network = state.multiplayer;
    if (!network || network.mode === 'local') return true;
    if (network.status !== 'connected' || network.sessionExpired || network.sessionReplaced || network.pending || network.room?.phase !== 'playing' || network.room.paused) return false;
    const me = network.room.players.find(player => player.id === network.playerId);
    return me?.color === state.game.players[state.game.currentPlayerIndex].color && !hasPlayerFinished(state.game, me.color);
};
export const selectCanControlGame = canControlGame;
export const selectCanRestart = state => state.multiplayer.mode === 'local'
    || (state.multiplayer.status === 'connected' && !state.multiplayer.sessionExpired && !state.multiplayer.sessionReplaced
        && !state.multiplayer.pending && state.multiplayer.room?.hostId === state.multiplayer.playerId);
