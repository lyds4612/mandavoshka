/* global globalThis */
import { chooseBotAction } from './chooseBotAction.js';

// Keep the search off the UI thread, especially on phones.
globalThis.onmessage = ({ data: { id, game } }) => {
    try { globalThis.postMessage({ id, action: chooseBotAction(game) }); }
    catch { globalThis.postMessage({ id, failed: true }); }
};
