import { useEffect, useMemo, useRef, useState } from 'react';
import { getPieceMovePreview } from '../../store/logic/gameRules.js';

export const pieceId = (color, index) => `${color}-${index}`;
export const pieceElement = (root, id) => root?.querySelector(`.piece[data-piece-id="${id}"]`);
export const pieceRect = element => {
    if (!element || !element.getClientRects().length) return null;
    const rect = element.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, size: rect.width };
};

export const usePieceInteraction = ({ game, canControl, tableRef, releaseOrigins, onAction, onReturn }) => {
    const [selectedId, setSelectedId] = useState(null);
    const [drag, setDrag] = useState(null);
    const [learnedDrag, setLearnedDrag] = useState(false);
    const gesture = useRef(null);
    const scrollFrame = useRef(null);
    const suppressClick = useRef(0);
    const latest = useRef(null);
    const player = game.players[game.currentPlayerIndex];
    const available = useMemo(() => {
        const result = {};
        if (canControl) game.pieces[player.color].forEach((piece, index) => {
            const preview = getPieceMovePreview(game, piece, player);
            if (preview) result[pieceId(player.color, index)] = { ...preview, piece, index, color: player.color };
        });
        return result;
    }, [game, canControl, player]);
    const selected = available[selectedId];
    const placing = Object.values(available).find(move => move.action === 'place');
    const preview = selected ?? placing;
    latest.current = { game, available, onAction, onReturn };

    const commit = (id, move, origin) => {
        setSelectedId(null);
        if (origin) releaseOrigins.current.set(id, { ...origin, tile: move.tile });
        const result = latest.current.onAction(move);
        const finish = () => {
            setDrag(null);
            // Server refusals leave the piece in place: return the released token.
            if (releaseOrigins.current.has(id)) {
                releaseOrigins.current.delete(id);
                if (origin) latest.current.onReturn(id, origin);
            }
        };
        Promise.resolve(result).then(finish, finish);
    };
    const cancel = () => {
        const current = gesture.current;
        gesture.current = null;
        cancelAnimationFrame(scrollFrame.current);
        if (current?.dragging) latest.current.onReturn(current.id, current.position);
        if (current && tableRef.current?.hasPointerCapture(current.pointerId)) tableRef.current.releasePointerCapture(current.pointerId);
        setDrag(null);
    };
    const cancelRef = useRef(cancel);
    cancelRef.current = cancel;
    useEffect(() => {
        if (gesture.current && (gesture.current.game !== game || !canControl)) cancelRef.current();
        if (selectedId && !available[selectedId]) setSelectedId(null);
    }, [game, canControl, available, selectedId]);
    useEffect(() => {
        const escape = event => { if (event.key === 'Escape') { cancelRef.current(); setSelectedId(null); } };
        const blur = () => cancelRef.current();
        window.addEventListener('keydown', escape);
        window.addEventListener('blur', blur);
        return () => { window.removeEventListener('keydown', escape); window.removeEventListener('blur', blur); cancelAnimationFrame(scrollFrame.current); gesture.current = null; };
    }, []);

    const hitTarget = (x, y, move) => {
        const hit = document.elementFromPoint(x, y);
        const tile = hit?.closest('[data-tile-index]');
        if (tile && tableRef.current?.contains(tile) && move.targets.includes(Number(tile.dataset.tileIndex))) return tile;
        const reserve = hit?.closest('[data-reserve-color]');
        return move.tile === null && reserve?.dataset.reserveColor === move.color ? reserve : null;
    };
    const onPointerDown = event => {
        suppressClick.current = 0;
        if (event.button !== 0 || event.isPrimary === false || gesture.current || drag) return;
        const source = event.target.closest('[data-piece-id]');
        const id = source?.dataset.pieceId;
        const move = available[id];
        const rect = pieceRect(pieceElement(tableRef.current, id));
        if (!move || !rect) return;
        setSelectedId(id);
        source.closest('button')?.focus({ preventScroll: true });
        gesture.current = { id, game, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, rect, position: rect, dragging: false };
        tableRef.current.setPointerCapture(event.pointerId);
    };
    const onPointerMove = event => {
        const current = gesture.current;
        if (!current || current.pointerId !== event.pointerId) return;
        if (!current.dragging && Math.hypot(event.clientX - current.startX, event.clientY - current.startY) < 6) return;
        if (!current.dragging) {
            current.dragging = true;
            const scroll = () => {
                const active = gesture.current;
                if (!active?.dragging) return;
                const y = active.position.y;
                const speed = y < 56 ? -Math.min(12, (56 - y) / 4) : y > window.innerHeight - 56 ? Math.min(12, (y - window.innerHeight + 56) / 4) : 0;
                let panned = false;
                const scroller = tableRef.current?.querySelector('.board-scroller');
                if (scroller && (scroller.scrollWidth > scroller.clientWidth + 1 || scroller.scrollHeight > scroller.clientHeight + 1)) {
                    const rect = scroller.getBoundingClientRect();
                    if (active.position.x >= rect.left - 16 && active.position.x <= rect.right + 16 && y >= rect.top - 16 && y <= rect.bottom + 16) {
                        const edgeSpeed = (value, start, end) => value < start + 40 ? -Math.min(10, (start + 40 - value) / 4)
                            : value > end - 40 ? Math.min(10, (value - end + 40) / 4) : 0;
                        const left = edgeSpeed(active.position.x, rect.left, rect.right), top = edgeSpeed(y, rect.top, rect.bottom);
                        const move = latest.current.available[active.id];
                        const target = move && hitTarget(active.position.x, y, move);
                        const targetRect = target?.getBoundingClientRect();
                        const targetVisible = targetRect && targetRect.left >= rect.left && targetRect.right <= rect.right
                            && targetRect.top >= rect.top && targetRect.bottom <= rect.bottom;
                        const edge = !targetVisible && (left || top) ? `${Math.sign(left)}:${Math.sign(top)}` : null;
                        if (edge !== active.panEdge) { active.panEdge = edge; active.panSince = performance.now(); }
                        // Crossing an edge should not move the destination away from the finger.
                        if (edge && performance.now() - active.panSince > 160) { scroller.scrollBy(left, top); panned = true; }
                    } else { active.panEdge = null; }
                }
                if (speed) window.scrollBy(0, speed);
                if (speed || panned) {
                    const move = latest.current.available[active.id];
                    const target = move && hitTarget(active.position.x, y, move);
                    setDrag(previous => previous && { ...previous, target: target?.dataset.tileIndex ?? (target ? 'reserve' : null) });
                }
                scrollFrame.current = requestAnimationFrame(scroll);
            };
            scrollFrame.current = requestAnimationFrame(scroll);
        }
        current.position = { x: event.clientX, y: event.clientY, size: Math.max(24, current.rect.size) };
        const move = latest.current.available[current.id];
        if (!move) { cancel(); return; }
        const target = hitTarget(event.clientX, event.clientY, move);
        setDrag({ ...current.position, id: current.id, color: move.color, phase: 'dragging', target: target?.dataset.tileIndex ?? (target ? 'reserve' : null) });
        event.preventDefault();
    };
    const onPointerUp = event => {
        const current = gesture.current;
        if (!current || event.pointerId !== current.pointerId) return;
        gesture.current = null;
        cancelAnimationFrame(scrollFrame.current);
        suppressClick.current = Date.now() + 350;
        if (tableRef.current.hasPointerCapture(event.pointerId)) tableRef.current.releasePointerCapture(event.pointerId);
        if (!current.dragging) return;
        const move = latest.current.available[current.id];
        if (move && current.game === latest.current.game && hitTarget(event.clientX, event.clientY, move)) {
            setLearnedDrag(true);
            setDrag({ ...current.position, id: current.id, color: move.color, phase: 'waiting', target: null });
            commit(current.id, move, current.position);
        } else {
            latest.current.onReturn(current.id, current.position);
            setDrag(null);
        }
    };
    const onTileClick = tileIndex => {
        const move = Object.entries(available).find(([, value]) => value.piece.tile === tileIndex);
        if (!selectedId && move) { setSelectedId(move[0]); return; }
        if (preview?.targets.includes(tileIndex)) { commit(selectedId ?? pieceId(preview.color, preview.index), preview); return; }
        setSelectedId(move?.[0] ?? null);
    };
    const onReserveClick = (color, index) => {
        if (selected?.tile === null && selected.color === color) { commit(selectedId, selected); return; }
        const id = pieceId(color, index);
        if (available[id]) setSelectedId(id);
    };
    return {
        selectedId, selectedTileIndex: selected?.piece.tile, available, drag,
        targetTiles: preview?.targets ?? [], returnColor: preview?.tile === null ? preview.color : null,
        onTileClick, onReserveClick, clearSelection: () => { cancel(); setSelectedId(null); },
        moveSelected: () => { if (selected?.action === 'move') commit(selectedId, selected); },
        hint: drag?.phase === 'waiting' ? 'Подтверждаем ход…' : preview?.tile === null ? 'Верните фишку в руку'
            : selected ? 'Перетащите фишку или нажмите на цель'
                : placing ? learnedDrag ? 'Старт подсвечен — поставьте фишку' : 'Перетащите фишку на старт'
                    : Object.keys(available).length ? 'Выберите фишку или перетащите её' : 'Для новой фишки нужна шестёрка',
        pointerHandlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: cancel, onLostPointerCapture: () => { if (gesture.current) cancel(); },
            onClickCapture: event => { if (event.detail !== 0 && Date.now() < suppressClick.current) { suppressClick.current = 0; event.preventDefault(); event.stopPropagation(); } } },
    };
};
