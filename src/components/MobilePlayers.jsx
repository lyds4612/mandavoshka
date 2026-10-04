import { useEffect, useState } from 'react';
import { PLAYER_THEMES, playerStyle, summarizePieces } from './gamePresentation';
import { getCharacter } from '../shared/characters';
import CharacterPortrait from './CharacterPortrait';
import GameDialog from './GameDialog';
import { countOccupiedHomeCells } from '../store/logic/gameRules';

const MobilePlayers = ({ players, pieces, tiles, prisonTileIndex, currentPlayerColor, participants = [], phase, paused, winners, loser }) => {
    const [detailsColor, setDetailsColor] = useState(null);
    useEffect(() => { setDetailsColor(null); }, [phase]);
    const details = players.find(player => player.color === detailsColor);
    const member = participants.find(player => player.color === detailsColor);
    const character = getCharacter(member?.characterId);
    const summary = details && summarizePieces(pieces[detailsColor], tiles, prisonTileIndex);
    return <div className="mobile-table-head">
        <div className="mobile-players" role="list" aria-label="Игроки. Нажмите на портрет для подробностей" style={{ '--mobile-player-count': players.length }}>
            {players.map(player => {
                const participant = participants.find(item => item.color === player.color);
                const name = participant?.name ?? PLAYER_THEMES[player.color].name;
                const hero = getCharacter(participant?.characterId);
                const connected = participant?.connected !== false;
                const won = winners.includes(player.color), lost = loser === player.color;
                const active = connected && phase === 'playing' && !paused && !loser && !won && player.color === currentPlayerColor;
                const finished = countOccupiedHomeCells(pieces[player.color], player.home);
                return <div key={player.color} role="listitem" className="mobile-player-item"><button type="button"
                    className={`mobile-player ${active ? 'is-active' : ''} ${!connected ? 'is-disconnected' : ''} ${won ? 'is-winner' : ''} ${lost ? 'is-loser' : ''}`}
                    style={playerStyle(player.color)} data-player-color={player.color} data-character-id={hero?.id} data-is-bot={Boolean(participant?.isBot)}
                    aria-current={active ? 'true' : undefined} aria-haspopup="dialog" onClick={() => setDetailsColor(player.color)}
                    aria-label={`${active ? 'Сейчас ходит: ' : ''}${name}. ${won ? 'Победитель' : lost ? 'Не успел' : !connected ? 'Отключился' : `В хате ${finished} из 4`}. Подробнее`}>
                    {hero ? <CharacterPortrait character={hero} className="mobile-player-portrait" loading="eager" /> : <span className="mobile-player-suit" aria-hidden="true">{PLAYER_THEMES[player.color].suit}</span>}
                    <span className="mobile-player-progress" aria-hidden="true">{finished}<span>/4</span></span>
                    <span className="mobile-player-turn" aria-hidden="true">{won ? '✓' : lost ? '✕' : !connected ? '!' : active ? '▶' : ''}</span>
                </button></div>;
            })}
        </div>
        <GameDialog open={Boolean(details)} title={member?.name ?? (details ? PLAYER_THEMES[details.color].name : '')} onClose={() => setDetailsColor(null)} className="player-info">
            {details && <div style={playerStyle(details.color)}>
                <div className="player-info-heading">{character && <CharacterPortrait character={character} className="player-info-portrait" loading="eager" />}
                    <div><strong>{character?.name ?? PLAYER_THEMES[details.color].suitName}</strong><span>{member?.isBot ? 'Бот' : member?.connected === false ? 'Отключился. Место сохранено' : 'В игре'}</span></div></div>
                <dl className="player-info-stats">{[['В хате',summary.home],['В руке',summary.hand],['На поле',summary.field],['СИЗО / тюрьма',`${summary.jail} / ${summary.prison}`]].map(([label,value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
                {character && <p className="player-info-story">{character.lore}</p>}
            </div>}
        </GameDialog>
    </div>;
};
export default MobilePlayers;
