import impactOneUrl from '../assets/dice/dice-impact-1.wav';
import impactTwoUrl from '../assets/dice/dice-impact-2.wav';
import impactThreeUrl from '../assets/dice/dice-impact-3.wav';

// Short contacts cut from Kenney Casino Audio (CC0), loaded from the game server.
export const createDiceImpactSounds = (context, output) => {
    const abort = new AbortController();
    const buffers = [];
    let disposed = false;
    [impactOneUrl, impactTwoUrl, impactThreeUrl].forEach(url => {
        fetch(url, { signal: abort.signal })
            .then(response => { if (!response.ok) throw new Error('Dice sample unavailable'); return response.arrayBuffer(); })
            .then(data => context.decodeAudioData(data))
            .then(buffer => { if (!disposed) buffers.push(buffer); })
            .catch(() => { /* Synthetic contacts remain available if a sample cannot load. */ });
    });
    return {
        play(type, at, track, strength = 1, contact = 'drop') {
            if (disposed || type !== 'dice-impact' || !buffers.length) return false;
            const source = context.createBufferSource(), gain = context.createGain();
            const filter = context.createBiquadFilter();
            source.buffer = buffers[Math.floor(Math.random() * buffers.length)];
            const edge = contact === 'edge';
            source.playbackRate.value = (edge ? 1.02 : .96) + Math.random() * .08;
            filter.type = 'highpass'; filter.frequency.value = edge ? 350 : 100;
            const duration = Math.min(source.buffer.duration / source.playbackRate.value, edge ? .075 : .14);
            const volume = (edge ? .55 : .7) * strength;
            gain.gain.setValueAtTime(volume, at);
            gain.gain.setValueAtTime(volume, at + Math.max(0, duration - .015));
            gain.gain.linearRampToValueAtTime(0, at + duration);
            source.connect(filter); filter.connect(gain); gain.connect(output);
            source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); };
            track(source); source.start(at); source.stop(at + duration);
            return true;
        },
        dispose() { disposed = true; abort.abort(); buffers.length = 0; },
    };
};
