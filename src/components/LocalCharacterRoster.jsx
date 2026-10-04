import { CHARACTERS, getCharacter } from '../shared/characters';
import { playerStyle } from './gamePresentation';
import CharacterPortrait from './CharacterPortrait';
import './LocalCharacterRoster.css';

const LocalCharacterRoster = ({ roster, characterId, onChange, onRandomize, bots = false }) => (
    <section className="local-character-roster" aria-label="Персонажи за столом">
        <div className="local-roster-heading"><div><h3>{bots ? 'Ваши соперники' : 'За одним столом'}</h3><p>{bots ? 'Боты играют за этих героев. Состав можно изменить.' : 'Остальные герои выбраны случайно. Каждый может выбрать своего.'}</p></div>
            <button type="button" className="button button-quiet randomize-characters" onClick={onRandomize}>Перемешать</button></div>
        <div className="local-character-seats" style={{ '--local-seat-count': roster.length }}>
            {roster.map((seat, index) => {
                const character = getCharacter(index === 0 ? characterId : seat.characterId);
                return <div className="local-character-seat" key={seat.color} data-seat-color={seat.color} data-character-id={character?.id ?? ''}
                    style={playerStyle(seat.color, character?.id)}>
                    <div className="local-seat-portrait">{character ? <CharacterPortrait character={character} loading="eager" /> : <span aria-hidden="true">?</span>}
                        <span className="piece local-seat-piece" aria-hidden="true" /></div>
                    <div className="local-seat-copy"><span>{index === 0 ? 'Вы' : `${bots ? 'Бот' : 'Место'} ${bots ? index : index + 1}`}</span>
                        {index === 0 ? <strong>{character?.title ?? 'Выберите героя выше'}</strong>
                            : <label className="local-seat-label"><span className="sr-only">Персонаж места {index + 1}</span>
                                <select className="character-seat-picker" aria-label={`Персонаж места ${index + 1}`} value={seat.characterId}
                                    onChange={event => onChange(seat.color, event.target.value)}>
                                    {CHARACTERS.filter(candidate => candidate.id === seat.characterId || !roster.some(other => other.color !== seat.color && other.characterId === candidate.id))
                                        .map(candidate => <option key={candidate.id} value={candidate.id}>{candidate.title}</option>)}
                                </select></label>}
                    </div>
                </div>;
            })}
        </div>
    </section>
);

export default LocalCharacterRoster;
