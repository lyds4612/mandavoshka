// Original instrumental "Тихий стол": 24 bars, D minor, 3/4, 78 BPM.
// Usage: node scripts/render-menu-music.cjs <lame.all.js> [output.mp3]
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const encoderPath = process.argv[2];
if (!encoderPath) throw new Error('Pass the standalone lamejs encoder path; see docs/SOUNDS.md.');
const rate = 44100, beat = 60 / 78, length = Math.round(24 * 3 * beat * rate);
const left = new Float64Array(length), right = new Float64Array(length);
let seed = 198704;
const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
const frequency = note => 440 * 2 ** ((note - 69) / 12);
const add = (at, duration, pan, sample) => {
    const start = Math.round(at * rate), size = Math.ceil(duration * rate);
    const l = Math.cos((pan + 1) * Math.PI / 4), r = Math.sin((pan + 1) * Math.PI / 4);
    for (let i = 0; i < size; i++) {
        const index = (start + i + length) % length, value = sample(i / rate);
        left[index] += value * l; right[index] += value * r;
    }
};
const guitar = (note, at, amplitude, pan = -.25, duration = 2.3) => {
    const f = frequency(note) * (1 + (random() - .5) * .001), phase = random() * Math.PI;
    add(at, duration, pan, t => {
        let value = 0;
        for (let h = 1; h <= 6; h++) value += Math.sin(2 * Math.PI * f * h * (1 + .00004 * h * h) * t + phase)
            * Math.exp(-(1.9 + h * .85) * t) / (h ** 1.55);
        return amplitude * value * (1 - Math.exp(-t * 200)) * Math.min(1, (duration - t) / .05);
    });
};
const bass = (note, at, amplitude) => {
    const f = frequency(note);
    add(at, 1.45, 0, t => amplitude * (Math.sin(2 * Math.PI * f * t) + .2 * Math.sin(4 * Math.PI * f * t))
        * (1 - Math.exp(-t * 85)) * Math.exp(-t * 3.2) * Math.min(1, (1.45 - t) / .06));
};
const reed = (note, at, amplitude, pan) => {
    const f = frequency(note), duration = 3 * beat + .4;
    add(at, duration, pan, t => {
        const phase = 2 * Math.PI * f * t + .035 * Math.sin(2 * Math.PI * 5.2 * t);
        const voice = Math.sin(phase) + .27 * Math.sin(phase * 2) + .12 * Math.sin(phase * 3) + .055 * Math.sin(phase * 5)
            + .25 * Math.sin(phase * 1.003);
        return amplitude * voice * Math.min(1, t / .24) * Math.min(1, (duration - t) / .6);
    });
};
const brush = at => {
    let smooth = 0;
    add(at, .16, .3, t => { const noise = random() * 2 - 1; smooth += .18 * (noise - smooth); return (noise - smooth) * .008 * Math.exp(-t * 34) * Math.min(1, t / .003); });
};
const chords = {
    Dm: [38, [57, 62, 65]], Gm: [43, [58, 62, 67]], Bb: [46, [58, 62, 65]],
    F: [41, [57, 60, 65]], A7: [45, [55, 61, 64]], C: [36, [55, 60, 64]], Ehalf: [40, [55, 58, 62]],
};
const progression = ['Dm', 'Dm', 'Gm', 'Gm', 'Bb', 'F', 'A7', 'A7', 'Dm', 'C', 'Gm', 'A7', 'Bb', 'Gm', 'A7', 'Dm', 'Dm', 'F', 'Gm', 'Bb', 'Ehalf', 'A7', 'Dm', 'A7'];
const melody = [
    [[.2,69],[1.7,65]], [[.1,64],[1.1,62]], [[.2,67],[1.7,70]], [[.2,69],[1.7,67]],
    [[.2,65],[1.2,69],[2.2,70]], [[.2,69],[1.7,65]], [[.2,64],[1.2,61]], [[.2,67],[2.1,64]],
    [[.2,65],[1.7,62]], [[.2,64],[1.2,67],[2.2,72]], [[.2,70],[1.7,67]], [[.2,69],[1.7,67]],
    [[.2,74],[1.7,70]], [[.2,69],[1.2,67]], [[.2,64],[1.7,61]], [[.2,62]],
    [[.2,65],[1.2,69]], [[.2,72],[1.7,69]], [[.2,70],[1.7,67]], [[.2,65],[1.7,62]],
    [[.2,64],[1.7,67]], [[.2,69],[1.2,67],[2.2,64]], [[.2,65],[1.7,62]], [[.2,61],[1.7,64]],
];
progression.forEach((name, bar) => {
    const [root, notes] = chords[name], at = bar * 3 * beat;
    bass(root, at + .012, .2); bass(root + 12, at + 2.45 * beat, .07);
    for (const step of [1, 2]) notes.forEach((note, index) => guitar(note, at + step * beat + index * .022, .067 + random() * .009, -.35));
    notes.slice(0, 2).forEach((note, index) => reed(note - 12, at, .017, index ? .5 : -.45));
    melody[bar].forEach(([step, note]) => guitar(note, at + step * beat + (random() - .5) * .013, .17, .18, 2.9));
    brush(at + beat); brush(at + 2 * beat);
});
// Circular room reflections keep the tail continuous at the loop seam.
const dryLeft = left.slice(), dryRight = right.slice();
for (const [delay, gain] of [[.071,.1],[.133,.07],[.227,.055],[.379,.04],[.557,.029],[.811,.021],[1.137,.016]]) {
    const shift = Math.round(delay * rate);
    for (let i = 0; i < length; i++) { const before = (i - shift + length) % length; left[i] += dryRight[before] * gain; right[i] += dryLeft[before] * gain; }
}
let peak = 0, energy = 0, lpL = left[length - 1], lpR = right[length - 1];
for (let i = 0; i < length; i++) {
    lpL += .52 * (left[i] - lpL); lpR += .52 * (right[i] - lpR); left[i] = lpL; right[i] = lpR;
    peak = Math.max(peak, Math.abs(lpL), Math.abs(lpR)); energy += lpL * lpL + lpR * lpR;
}
const rms = Math.sqrt(energy / (2 * length)), scale = Math.min(.72 / peak, .1 / rms);
// Audio on both sides of the loop avoids MP3 encoder padding in the loop region.
const padding = Math.round(.12 * rate), pcmLength = length + 2 * padding;
const pcmLeft = new Int16Array(pcmLength), pcmRight = new Int16Array(pcmLength);
for (let i = 0; i < pcmLength; i++) { const index = (i - padding + length) % length; pcmLeft[i] = Math.round(left[index] * scale * 32767); pcmRight[i] = Math.round(right[index] * scale * 32767); }
const sandbox = { console }; vm.createContext(sandbox); vm.runInContext(fs.readFileSync(encoderPath, 'utf8'), sandbox);
const encoder = new sandbox.lamejs.Mp3Encoder(2, rate, 192), chunks = [];
for (let i = 0; i < pcmLength; i += 1152) { const chunk = encoder.encodeBuffer(pcmLeft.subarray(i, i + 1152), pcmRight.subarray(i, i + 1152)); if (chunk.length) chunks.push(Buffer.from(chunk)); }
chunks.push(Buffer.from(encoder.flush()));
const outputPath = path.resolve(process.argv[3] || path.join(__dirname, '../src/assets/menu-table.mp3'));
fs.writeFileSync(outputPath, Buffer.concat(chunks));
console.log(JSON.stringify({ file: outputPath, bytes: fs.statSync(outputPath).size, loopSeconds: length / rate, peak: peak * scale, rms: rms * scale }));
