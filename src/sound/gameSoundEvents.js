import { getPieceMovePreview } from '../store/logic/gameRules.js';
import { slowAnimation } from '../shared/animationTiming.js';
import { TILE_TYPES } from '../store/utils/tileUtils.js';

export const getGameSoundEvents = (before, after, { dragged = false, reducedMotion = false } = {}) => {
    if (!before || after.rollCount === 0 || after.rollCount !== before.rollCount) return [];
    const player = before.players[before.currentPlayerIndex];
    const index = before.pieces[player.color].findIndex((piece, i) => piece.tile !== after.pieces[player.color]?.[i]?.tile);
    if (index < 0) return [];
    const old = before.pieces[player.color][index], piece = after.pieces[player.color][index];
    const preview = getPieceMovePreview(before, old, player);
    if (!preview || preview.tile !== piece.tile) return [];

    const events = [];
    const add = (type, delay) => events.push({ type, delay: Math.round(delay) });
    const path = preview.path;
    const duration = reducedMotion ? 0 : old.tile === null ? slowAnimation(380)
        : dragged ? slowAnimation(180) : slowAnimation(Math.min(720, 180 + (path.length - 1) * 70));
    const alleyEntry = path.findIndex(tile => before.tiles[tile]?.name === TILE_TYPES.alley && preview.targets.includes(tile));
    const transfers = alleyEntry >= 0 && path.length > 1;
    const singleLanding = reducedMotion || dragged || old.tile === null || piece.tile === null;
    const steps = singleLanding ? 1 : Math.min(before.moves[0], path.length);
    for (let step = 1; step <= steps; step += 1) add('step', duration * step / (singleLanding ? 1 : path.length));
    if (transfers) add('alley', reducedMotion ? 0 : duration * (alleyEntry + 1) / path.length);
    if (before.tiles[piece.tile]?.name === TILE_TYPES.jail && before.tiles[old.tile]?.name !== TILE_TYPES.jail) add('prison', duration);

    const captureTiles = new Set();
    Object.entries(before.pieces).forEach(([color, pieces]) => {
        if (color === player.color) return;
        pieces.forEach((opponent, i) => {
            if (opponent.tile !== null && opponent.tile !== before.prisonTileIndex && after.pieces[color]?.[i]?.tile === after.prisonTileIndex) captureTiles.add(opponent.tile);
        });
    });
    const impact = old.tile === null ? slowAnimation(320) : dragged ? slowAnimation(100) : duration;
    captureTiles.forEach(tile => {
        const captureStep = path.indexOf(tile);
        const delay = reducedMotion ? 0 : !dragged && captureStep >= 0 ? impact * (captureStep + 1) / path.length : impact;
        add('capture', delay);
        add('prison', reducedMotion ? 80 : delay + slowAnimation(440));
    });
    return events.sort((a, b) => a.delay - b.delay);
};
