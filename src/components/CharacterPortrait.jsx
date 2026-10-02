const CharacterPortrait = ({ character, className = '', loading = 'lazy' }) => (
    <img className={`character-portrait ${className}`} src={`${process.env.PUBLIC_URL}${character.portrait}`}
        alt="" loading={loading} decoding="async" />
);

export default CharacterPortrait;
