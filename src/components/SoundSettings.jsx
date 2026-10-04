import { useEffect, useId, useRef, useState } from 'react';
import './SoundSettings.css';

const Speaker = ({ muted }) => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <path d="M10 5L5 9H2V15H5L10 19Z" />{muted ? <path d="M15 9L21 15M21 9L15 15" /> : <><path d="M14 8Q18 12 14 16M17 5Q24 12 17 19" /></>}</svg>;

const SoundSettings = ({ sound, inline = false, navigationOpen = true }) => {
    const [open, setOpen] = useState(false);
    const root = useRef(null), trigger = useRef(null), range = useRef(null);
    const id = useId();
    const muted = !sound.enabled || sound.volume === 0;
    const musicOn = sound.musicEnabled && sound.musicVolume > 0;
    const playing = sound.musicStatus === 'playing' && !muted && sound.musicEnabled && sound.musicVolume > 0;
    useEffect(() => {
        if (inline) return;
        const mobile = window.matchMedia('(max-width: 980px), (pointer: coarse) and (max-height: 600px) and (orientation: landscape)');
        const closeHidden = () => { if (mobile.matches && !navigationOpen) setOpen(false); };
        closeHidden(); mobile.addEventListener('change', closeHidden);
        return () => mobile.removeEventListener('change', closeHidden);
    }, [navigationOpen, inline]);
    useEffect(() => {
        if (!open || inline) return;
        range.current?.focus({ preventScroll: true });
        const outside = event => { if (!root.current?.contains(event.target)) setOpen(false); };
        const escape = event => { if (event.key === 'Escape') { event.stopPropagation(); setOpen(false); trigger.current?.focus(); } };
        document.addEventListener('pointerdown', outside); document.addEventListener('focusin', outside);
        window.addEventListener('keydown', escape, true);
        return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('focusin', outside); window.removeEventListener('keydown', escape, true); };
    }, [open, inline]);
    const musicCaption = !sound.musicEnabled || sound.musicVolume === 0 ? 'Музыка выключена' : muted ? 'Звук выключен'
        : sound.musicStatus === 'loading' ? 'Музыка загружается…' : sound.musicStatus === 'error' ? 'Не удалось загрузить музыку'
        : playing ? 'Тихий стол · инструментал' : 'Играет в меню и до начала партии';
    return <div ref={root} className={`sound-settings ${inline ? 'sound-settings-inline' : ''}`}>
        {!inline && <button ref={trigger} type="button" className="button button-quiet sound-settings-toggle" aria-label="Настройки звука"
            aria-expanded={open} aria-controls={id} onClick={() => setOpen(value => !value)}><Speaker muted={muted} /><span>{muted ? 'Выкл' : `${sound.volume}%`}</span></button>}
        {(inline || open) && <section id={id} className="sound-panel" aria-label="Настройки звука">
            <div className="sound-panel-heading"><div><span className={`music-indicator ${playing ? 'is-playing' : ''}`} aria-hidden="true"><i /><i /><i /></span><h3>{inline ? 'Атмосфера за столом' : 'Звук'}</h3></div>
                <button type="button" className="button button-quiet sound-toggle" aria-pressed={!muted}
                    aria-label={muted ? 'Включить звук' : 'Выключить звук'} onClick={sound.toggle}><Speaker muted={muted} /><span>{muted ? 'Включить' : 'Выключить'}</span></button>
                {!inline && <button type="button" className="sound-panel-close" aria-label="Закрыть настройки звука" onClick={() => { setOpen(false); trigger.current?.focus(); }}>×</button>}</div>
            <div className="sound-ranges"><div className="sound-range-row">
                <label htmlFor={`${id}-volume`}>Громкость <output htmlFor={`${id}-volume`}>{sound.volume}%</output></label>
                <input ref={range} id={`${id}-volume`} className="audio-volume" type="range" min="0" max="100" step="1" value={sound.volume}
                    aria-label="Общая громкость" aria-valuetext={`${sound.volume} процентов`} style={{ '--range-progress': `${sound.volume}%` }} onChange={event => sound.setVolume(Number(event.target.value))} />
            </div><div className="sound-range-row">
                <div className="music-volume-heading"><label htmlFor={`${id}-music`}>Музыка меню <output htmlFor={`${id}-music`}>{sound.musicVolume}%</output></label>
                    <button type="button" className="music-enabled-toggle" role="switch" aria-checked={musicOn} aria-label="Музыка меню" onClick={sound.toggleMusic}><span /></button></div>
                <input id={`${id}-music`} className="music-volume" type="range" min="0" max="100" step="1" value={sound.musicVolume}
                    aria-label="Громкость музыки" aria-valuetext={`${sound.musicVolume} процентов`} style={{ '--range-progress': `${sound.musicVolume}%` }} onChange={event => sound.setMusicVolume(Number(event.target.value))} />
            </div></div>
            <p className="sound-music-caption" role="status">{musicCaption}{sound.musicStatus === 'error' && <button type="button" className="retry-menu-music" onClick={sound.retryMusic}>Повторить</button>}</p>
        </section>}
    </div>;
};

export default SoundSettings;
