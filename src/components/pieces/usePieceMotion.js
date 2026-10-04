import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { getPieceMovePreview } from '../../store/logic/gameRules.js';
import { slowAnimation } from '../../shared/animationTiming.js';
import { pieceElement, pieceId, pieceRect } from './usePieceInteraction';

const readPositions = root => new Map([...root?.querySelectorAll('.piece[data-piece-id]') ?? []]
    .map(element => [element.dataset.pieceId, pieceRect(element)]).filter(([, rect]) => rect));
const transform = (point, size, lift = 0, rotation = 0) =>
    `translate3d(${point.x - size / 2}px, ${point.y - size / 2 - lift}px, 0) scale(${point.size / size}) rotate(${rotation}deg)`;

export const usePieceMotion = ({ game, tableRef, releaseOrigins, scope }) => {
    const layerRef = useRef(null);
    const previous = useRef(null);
    const positions = useRef(new Map());
    const flights = useRef(new Map());
    const previousScope = useRef(scope);
    const stopFlight = useCallback(id => {
        const flight = flights.current.get(id);
        if (!flight) return;
        flights.current.delete(id);
        flight.animation.cancel(); flight.clone.remove(); flight.target.style.visibility = '';
    }, []);
    const stopAll = useCallback(() => [...flights.current.keys()].forEach(stopFlight), [stopFlight]);
    const refreshPositions = useCallback(() => { stopAll(); positions.current = readPositions(tableRef.current); }, [stopAll, tableRef]);
    const animate = (id, from, to, kind, waypoints = [], delay = 0) => {
        const target = pieceElement(tableRef.current, id);
        if (!target || !from || !to || !layerRef.current || !target.animate) return;
        const displayed = flights.current.get(id)?.clone;
        if (displayed) from = pieceRect(displayed);
        stopFlight(id);
        const clone = target.cloneNode(false);
        clone.className = 'piece piece-flight';
        clone.removeAttribute('data-piece-id');
        clone.dataset.motionKind = kind; clone.dataset.movingPiece = id;
        clone.setAttribute('aria-hidden', 'true');
        const computed = getComputedStyle(target);
        ['--player-light', '--player-accent', '--player-dark'].forEach(name => clone.style.setProperty(name, computed.getPropertyValue(name)));
        const size = Math.max(from.size, to.size);
        Object.assign(clone.style, { width: `${size}px`, height: `${size}px`, visibility: '', opacity: '1' });
        layerRef.current.appendChild(clone);
        target.style.visibility = 'hidden';
        const points = [from, ...waypoints, to];
        const frames = kind === 'capture' ? [
            { transform: transform(from, size) },
            { transform: transform({ ...from, x: from.x + size * .6 }, size, 8, 24), offset: .18 },
            { transform: transform({ x: (from.x + to.x) / 2, y: (from.y + to.y) / 2, size }, size, 38, 135), offset: .65 },
            { transform: transform(to, size, 0, 180) },
        ] : points.map((point, index) => ({
            transform: transform(point, size, index === 0 || index === points.length - 1 ? 0 : kind === 'move' ? 5 : 28),
            offset: index / (points.length - 1),
        }));
        const duration = kind === 'move' ? Math.min(720, 180 + waypoints.length * 70) : kind === 'capture' ? 440 : kind === 'return' ? 210 : 380;
        const animation = clone.animate(frames, { duration: slowAnimation(duration), delay: slowAnimation(delay), easing: 'cubic-bezier(.22,.7,.25,1)', fill: 'both' });
        const flight = { clone, animation, target, scrollX: window.scrollX, scrollY: window.scrollY };
        flights.current.set(id, flight);
        const clean = () => {
            if (flights.current.get(id) !== flight) return;
            flights.current.delete(id); clone.remove(); target.style.visibility = '';
            const cell = target.closest('.cell');
            const canBounce = !cell?.classList.contains('prison') && Number(cell?.dataset.pieceCount ?? 1) < 2;
            if (kind !== 'return' && canBounce) target.animate([
                { transform: 'scale(1.16)', filter: 'brightness(1.4)' }, { transform: 'scale(.94)' }, { transform: 'scale(1)', filter: 'brightness(1)' },
            ], { duration: slowAnimation(180), easing: 'ease-out' });
        };
        animation.finished.then(clean, clean);
    };
    const returnDrag = (id, origin) => {
        const to = pieceRect(pieceElement(tableRef.current, id));
        if (!to || !origin) return;
        animate(id, origin, to, 'return', [{ x: (origin.x + to.x) / 2, y: (origin.y + to.y) / 2, size: origin.size }]);
    };

    useLayoutEffect(() => {
        const current = readPositions(tableRef.current);
        const before = previous.current;
        if (before && before.pieces !== game.pieces && previousScope.current === scope) {
            const changes = [];
            Object.entries(game.pieces).forEach(([color, pieces]) => pieces.forEach((piece, index) => {
                const old = before.pieces[color]?.[index];
                if (old && old.tile !== piece.tile) changes.push({ id: pieceId(color, index), piece, old, color });
            }));
            const reset = game.rollCount < before.rollCount || (game.canRoll && game.rollCount === 0);
            const mover = changes.find(change => change.color === before.players[before.currentPlayerIndex].color);
            const moverPreview = mover && getPieceMovePreview(before, mover.old, before.players[before.currentPlayerIndex]);
            const moverWasDragged = releaseOrigins.current.has(mover?.id);
            const impactDelay = mover?.old.tile === null ? 320 : moverWasDragged ? 100
                : Math.min(720, 180 + Math.max(0, (moverPreview?.path.length ?? 1) - 1) * 70);
            changes.forEach(({ id, piece, old, color }) => {
                const release = releaseOrigins.current.get(id);
                releaseOrigins.current.delete(id);
                const from = release?.tile === piece.tile ? release : positions.current.get(id);
                const to = current.get(id);
                const player = before.players.find(value => value.color === color);
                const preview = getPieceMovePreview(before, old, player);
                const captured = !reset && old.tile !== null && piece.tile === game.prisonTileIndex && color !== before.players[before.currentPlayerIndex].color;
                const kind = captured ? 'capture' : piece.tile === null ? 'reset' : old.tile === null ? 'place' : 'move';
                const path = !release && preview?.tile === piece.tile && !captured && !reset ? preview.path.slice(0, -1).map(tile => {
                    const cell = tableRef.current.querySelector(`[data-tile-index="${tile}"]`);
                    const rect = pieceRect(cell);
                    return rect ? { ...rect, size: to?.size ?? from?.size } : null;
                }).filter(Boolean) : [];
                if (kind === 'place' || kind === 'reset') path.push({ x: (from?.x + to?.x) / 2, y: (from?.y + to?.y) / 2, size: to?.size });
                const captureStep = moverPreview?.path.indexOf(old.tile) ?? -1;
                const captureDelay = !moverWasDragged && captureStep >= 0
                    ? impactDelay * (captureStep + 1) / moverPreview.path.length : impactDelay;
                animate(id, from, to, kind, path, captured ? captureDelay : 0);
            });
        } else if (previousScope.current !== scope) { stopAll(); releaseOrigins.current.clear(); }
        previous.current = game;
        previousScope.current = scope;
        positions.current = current;
    });
    useEffect(() => {
        const scroll = event => {
            if (event.target?.classList?.contains('board-scroller')) { refreshPositions(); return; }
            flights.current.forEach(flight => {
                flight.clone.style.left = `${flight.scrollX - window.scrollX}px`;
                flight.clone.style.top = `${flight.scrollY - window.scrollY}px`;
            });
            positions.current = readPositions(tableRef.current);
        };
        window.addEventListener('resize', refreshPositions);
        window.addEventListener('scroll', scroll, true);
        return () => { window.removeEventListener('resize', refreshPositions); window.removeEventListener('scroll', scroll, true); stopAll(); };
    }, [stopAll, tableRef, refreshPositions]);
    return { layerRef, returnDrag, refreshPositions };
};
