import { getCharacter } from './characters';

const KEY = 'mandavoshka.player.profile.v1';
const DEFAULT_PROFILE = { name: '', characterId: '', color: 'green', tutorialPromptSeen: false, tutorialCompleted: false };
export const readPlayerProfile = () => {
    try {
        const saved = JSON.parse(localStorage.getItem(KEY));
        if (!saved || typeof saved !== 'object') return { ...DEFAULT_PROFILE };
        return { name: typeof saved.name === 'string' ? saved.name.slice(0,24) : '',
            characterId: getCharacter(saved.characterId)?.id ?? '',
            color: ['green','red','orange','black'].includes(saved.color) ? saved.color : 'green',
            tutorialPromptSeen: saved.tutorialPromptSeen === true, tutorialCompleted: saved.tutorialCompleted === true };
    } catch { return { ...DEFAULT_PROFILE }; }
};
export const savePlayerProfile = profile => { try { localStorage.setItem(KEY,JSON.stringify(profile)); } catch { /* Playing remains available without storage. */ } };
