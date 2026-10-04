import { CHARACTERS, getCharacter } from '../shared/characters';
import CharacterPortrait from './CharacterPortrait';
import { getCharacterPalette } from './gamePresentation';
import './CharacterPicker.css';

const CharacterPicker = ({ value, onChange, disabled }) => {
    const selected = getCharacter(value);
    return (
        <fieldset className="character-picker" disabled={disabled}>
            <legend>Ваш персонаж</legend>
            <p className="character-picker-hint">Выберите героя. Его фишки будут в цвет униформы; историю можно раскрыть ниже.</p>
            <div className="character-choices">
                {CHARACTERS.map(character => (
                    <label key={character.id} className="character-choice" data-selected={value === character.id}
                        style={{ '--character-color': getCharacterPalette(character.id).accent }} title={character.name}>
                        <input className="character-radio" type="radio" name="character" value={character.id}
                            checked={value === character.id} onChange={() => onChange(character.id)} required aria-label={character.name} />
                        <span className="character-choice-body">
                            <CharacterPortrait character={character} className="character-choice-portrait" />
                            <span className="character-choice-title">{character.title}</span>
                            <span className="character-choice-check" aria-hidden="true">✓</span>
                        </span>
                    </label>
                ))}
            </div>
            {selected && <details className="character-lore" key={selected.id}>
                <summary><span className="character-uniform-dot" style={{ background: getCharacterPalette(selected.id).accent }} aria-hidden="true" />
                    <strong>{selected.title}</strong><span>История героя</span></summary>
                <article className="character-story" data-character-id={selected.id}>
                <CharacterPortrait character={selected} className="character-story-portrait" loading="eager" />
                <div className="character-story-copy">
                    <span className="character-story-caption">Личное дело · выбран</span>
                    <h3 role="status">{selected.name}</h3>
                    {selected.lore.split(/\n\s*\n/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
                </div>
                </article>
            </details>}
        </fieldset>
    );
};

export default CharacterPicker;
