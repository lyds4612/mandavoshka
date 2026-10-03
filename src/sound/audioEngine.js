const VOLUME = 0.18;

export const synthesizeSound = (context, output, type, at, track = () => {}, strength = 1) => {
    const tone = (frequency, endFrequency, duration, volume, waveform = 'sine', offset = 0) => {
        const oscillator = context.createOscillator(), gain = context.createGain(), start = at + offset;
        oscillator.type = waveform;
        oscillator.frequency.setValueAtTime(frequency, start);
        oscillator.frequency.exponentialRampToValueAtTime(endFrequency, start + duration);
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(volume * strength, start + 0.006);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
        oscillator.connect(gain); gain.connect(output);
        oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
        track(oscillator);
        oscillator.start(start); oscillator.stop(start + duration + 0.01);
    };
    const noise = (duration, frequency, volume, offset = 0) => {
        const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * duration), context.sampleRate), data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        const source = context.createBufferSource(), filter = context.createBiquadFilter(), gain = context.createGain(), start = at + offset;
        source.buffer = buffer; filter.type = 'bandpass'; filter.frequency.value = frequency; filter.Q.value = 0.7;
        gain.gain.setValueAtTime(volume * strength, start); gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
        source.connect(filter); filter.connect(gain); gain.connect(output);
        source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); };
        track(source); source.start(start); source.stop(start + duration);
    };
    if (type === 'step') {
        tone(190, 85, 0.07, 0.45); noise(0.045, 750, 0.35);
    } else if (type === 'capture') {
        tone(150, 45, 0.18, 0.7); tone(760, 310, 0.12, 0.22, 'triangle'); noise(0.14, 1600, 0.55);
    } else if (type === 'prison') {
        noise(0.24, 2400, 0.32); tone(330, 170, 0.3, 0.25, 'triangle');
        tone(710, 620, 0.22, 0.2, 'sine', 0.06); tone(940, 800, 0.17, 0.12, 'sine', 0.1);
    } else if (type === 'alley') {
        noise(0.26, 1100, 0.3); tone(260, 980, 0.24, 0.22, 'sine'); tone(980, 450, 0.15, 0.15, 'sine', 0.2);
    } else if (type === 'dice-throw') {
        noise(0.18, 1500, 0.3); tone(440, 280, 0.07, 0.18, 'triangle');
        noise(0.035, 2600, 0.27, 0.05); noise(0.03, 2100, 0.21, 0.11);
    } else if (type === 'dice-impact') {
        noise(0.075, 2200, 0.42); tone(320, 165, 0.085, 0.32, 'triangle'); tone(1250, 780, 0.045, 0.09);
    }
};

export const createAudioEngine = () => {
    let context = null, output = null, enabled = true;
    const voices = new Map();
    const stop = group => {
        voices.forEach((sourceGroup, source) => {
            if (group && group !== sourceGroup) return;
            try { source.stop(); } catch { /* Already ended. */ }
            voices.delete(source);
        });
    };
    const unlock = () => {
        if (!enabled || document.hidden) return;
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        try {
            if (!context || context.state === 'closed') {
                context = new AudioContext(); output = context.createGain();
                output.gain.value = VOLUME; output.connect(context.destination);
            }
            if (context.state === 'suspended') context.resume().catch(() => {});
        } catch { /* Sound availability never prevents a move. */ }
    };
    return {
        unlock,
        stop,
        setEnabled(value) {
            enabled = value;
            if (output) output.gain.value = enabled ? VOLUME : 0;
            if (!enabled) stop();
        },
        play(events, group = 'pieces') {
            if (!enabled || !context || context.state !== 'running' || document.hidden) return;
            const unique = new Set();
            events.slice(0, 16).forEach(({ type, delay, strength }) => {
                const key = `${type}:${delay}`;
                if (unique.has(key) || voices.size >= 64) return;
                unique.add(key);
                synthesizeSound(context, output, type, context.currentTime + 0.01 + delay / 1000, source => {
                    voices.set(source, group);
                    source.addEventListener('ended', () => voices.delete(source), { once: true });
                }, strength);
            });
        },
        dispose() {
            stop();
            if (context && context.state !== 'closed') context.close().catch(() => {});
            context = null; output = null;
        },
    };
};
