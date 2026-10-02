const STORAGE_KEY = 'mandavoshka.online.recovery.v1';
const MAX_AGE = 7 * 24 * 60 * 60_000;

export const readSavedSessions = () => {
    try {
        const records = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
        return Array.isArray(records) ? records.filter(record => record && typeof record.token === 'string' && record.token.length <= 128
            && typeof record.playerId === 'string' && /^[A-Z2-9]{6}$/.test(record.roomCode)
            && record.savedAt > Date.now() - MAX_AGE).slice(0, 16) : [];
    } catch { return []; }
};
const writeSessions = records => {
    try {
        const value = JSON.stringify(records);
        if (window.localStorage.getItem(STORAGE_KEY) !== value) window.localStorage.setItem(STORAGE_KEY, value);
    } catch { /* Tab refresh still works with sessionStorage. */ }
};
export const saveRecoverySession = session => {
    writeSessions([{ ...session, savedAt: Date.now() }, ...readSavedSessions().filter(record => record.playerId !== session.playerId)].slice(0, 16));
};
export const forgetRecoverySession = playerId => {
    writeSessions(readSavedSessions().filter(record => record.playerId !== playerId));
};
export const retainRecoverySessions = available => {
    const ids = new Set(available.map(record => record.playerId));
    writeSessions(readSavedSessions().filter(record => ids.has(record.playerId)));
};
