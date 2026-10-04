import './BotCountPicker.css';

const BotCountPicker = ({ value, onChange, min = 0, max = 3, disabled = false, context, hint }) => (
    <fieldset className="bot-count-picker" data-context={context} disabled={disabled}>
        <legend>{context === 'create' ? 'Боты в новой комнате' : 'Количество ботов'}</legend>
        <div className="bot-count-options">{Array.from({ length: 4 - min }, (_, index) => index + min).map(count => (
            <button key={count} type="button" data-bot-count={count} aria-label={`${count} ${count === 1 ? 'бот' : count === 0 ? 'ботов' : 'бота'}`}
                aria-pressed={value === count} disabled={disabled || count > max} onClick={() => onChange(count)}>{count}</button>
        ))}</div>
        {hint && <p>{hint}</p>}
    </fieldset>
);

export default BotCountPicker;
