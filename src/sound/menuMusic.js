const LOOP_SECONDS = Math.round(24 * 3 * (60 / 78) * 44100) / 44100;

export const createMenuMusic = (context, output, url, onState = () => {}) => {
    const gain = context.createGain(); gain.gain.value = 0; gain.connect(output);
    const abort = new AbortController();
    let buffer = null, loading = null, source = null, wanted = false, disposed = false;
    let volume = .4, offset = 0, startedAt = 0, pauseTimer = null, state = 'idle';
    const notify = value => { if (!disposed && value !== state) { state = value; onState(value); } };
    const fade = value => {
        gain.gain.cancelScheduledValues(context.currentTime);
        gain.gain.setTargetAtTime(value, context.currentTime, .085);
    };
    const pause = () => {
        clearTimeout(pauseTimer); pauseTimer = null;
        if (!source) return;
        offset = (offset + context.currentTime - startedAt) % LOOP_SECONDS;
        const previous = source; source = null;
        try { previous.stop(); } catch { /* Already stopped. */ }
        previous.disconnect();
    };
    const start = () => {
        if (disposed || !wanted || !buffer || context.state !== 'running') return;
        clearTimeout(pauseTimer); pauseTimer = null;
        if (!source) {
            source = context.createBufferSource(); source.buffer = buffer; source.loop = true;
            const duration = Math.min(LOOP_SECONDS, buffer.duration), padding = Math.max(0, (buffer.duration - duration) / 2);
            source.loopStart = padding; source.loopEnd = padding + duration;
            source.connect(gain); startedAt = context.currentTime;
            source.start(startedAt, padding + offset % duration);
        }
        fade(volume * .9); notify('playing');
    };
    const load = () => {
        if (disposed || loading || state === 'error') return;
        notify('loading');
        loading = fetch(url, { signal: abort.signal })
            .then(response => { if (!response.ok) throw new Error('Music unavailable'); return response.arrayBuffer(); })
            .then(data => context.decodeAudioData(data))
            .then(decoded => { if (disposed) return; buffer = decoded; wanted ? start() : notify('paused'); })
            .catch(() => { if (!disposed) notify('error'); })
            .finally(() => { loading = null; });
    };
    return {
        setPlaying(value) {
            wanted = value;
            if (disposed) return;
            if (wanted) { buffer ? start() : load(); }
            else {
                fade(0);
                if (source && !pauseTimer) pauseTimer = setTimeout(pause, 420);
                if (state !== 'error') notify(buffer || loading ? 'paused' : 'idle');
            }
        },
        setVolume(value) { volume = value; if (source && wanted) fade(volume * .9); },
        retry() { if (state === 'error') { notify('idle'); if (wanted) load(); } },
        dispose() { disposed = true; wanted = false; abort.abort(); pause(); buffer = null; gain.disconnect(); },
    };
};
