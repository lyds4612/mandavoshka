import { configureStore } from '@reduxjs/toolkit';
import gameReducer from './gameSlice.js';
import multiplayerReducer from './multiplayerSlice.js';
import localGameReducer from './localGameSlice.js';
import { multiplayerMiddleware } from '../multiplayer/socketClient.js';

export const store = configureStore({
    reducer: {
        game: gameReducer,
        multiplayer: multiplayerReducer,
        localGame: localGameReducer,
    },
    middleware: getDefaultMiddleware => getDefaultMiddleware().concat(multiplayerMiddleware),
});

export default store;
