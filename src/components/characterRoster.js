import { CHARACTERS } from '../shared/characters';
import { PLAYER_COLORS } from '../store/gameBoardInit';

export const createLocalRoster = (characterId = '') => {
    const pool = CHARACTERS.filter(character => character.id !== characterId).map(character => character.id);
    for (let index = pool.length - 1; index > 0; index -= 1) {
        const other = Math.floor(Math.random() * (index + 1));
        [pool[index], pool[other]] = [pool[other], pool[index]];
    }
    return PLAYER_COLORS.map((color, index) => ({ color, characterId: index === 0 && characterId ? characterId : pool.shift() }));
};

export const selectLocalCharacter = (roster, characterId, color = roster[0].color) => {
    const previous = roster.find(seat => seat.color === color).characterId;
    return roster.map(seat => ({ ...seat,
        characterId: seat.color === color ? characterId : seat.characterId === characterId ? previous : seat.characterId,
    }));
};
