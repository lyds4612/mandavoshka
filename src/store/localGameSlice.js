import { createSlice } from '@reduxjs/toolkit';

const initialState = { mode: null, active: false, paused: false, humanColor: 'green', botCount: 3 };
const localGameSlice = createSlice({
    name: 'localGame', initialState,
    reducers: {
        startLocalGame(state, { payload }) {
            const mode = typeof payload === 'string' ? payload : payload?.mode;
            const botCount = typeof payload === 'string' ? 3 : payload?.botCount;
            if (mode !== 'bots' && mode !== 'manual') return;
            if (mode === 'bots' && (!Number.isInteger(botCount) || botCount < 1 || botCount > 3)) return;
            state.mode = mode; state.botCount = mode === 'bots' ? botCount : 0;
            state.active = true; state.paused = false;
        },
        pauseLocalGame(state) { if (state.active) state.paused = true; },
        resumeLocalGame(state) { if (state.active) state.paused = false; },
    },
    extraReducers: builder => builder
        .addCase('multiplayer/sessionJoined', () => initialState)
        .addCase('multiplayer/returnToLocal', () => initialState),
});

export const { startLocalGame, pauseLocalGame, resumeLocalGame } = localGameSlice.actions;
export const selectLocalGame = state => state.localGame;
export default localGameSlice.reducer;
