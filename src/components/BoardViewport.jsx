import { useEffect, useLayoutEffect, useRef } from 'react';

const BoardViewport = ({ children, zoomed, onZoomChange, focusTileIndex, onLayoutChange }) => {
    const viewport = useRef(null);
    const focusTile = useRef(focusTileIndex);
    focusTile.current = focusTileIndex;
    useEffect(() => {
        const desktop = window.matchMedia('(min-width: 981px)');
        const update = () => { if (desktop.matches) onZoomChange(false); };
        update(); desktop.addEventListener('change', update);
        return () => desktop.removeEventListener('change', update);
    }, [onZoomChange]);
    useLayoutEffect(() => {
        const scroller = viewport.current;
        if (zoomed) {
            const tile = scroller.querySelector(`[data-tile-index="${focusTile.current}"]`);
            if (tile) {
                const rect = tile.getBoundingClientRect(), view = scroller.getBoundingClientRect();
                scroller.scrollLeft += rect.left + rect.width / 2 - view.left - view.width / 2;
                scroller.scrollTop += rect.top + rect.height / 2 - view.top - view.height / 2;
            }
        } else { scroller.scrollLeft = 0; scroller.scrollTop = 0; }
        onLayoutChange();
    }, [zoomed, onLayoutChange]);
    return <div className="board-shell" data-zoomed={String(zoomed)}>
        <div className="board-scroller" ref={viewport} role="region" aria-label={zoomed ? 'Увеличенное поле. Прокручивайте, чтобы увидеть остальные клетки' : 'Игровая доска'} tabIndex={zoomed ? 0 : undefined}>
            {children}
        </div>
    </div>;
};

export default BoardViewport;
