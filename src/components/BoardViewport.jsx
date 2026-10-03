import { useEffect, useLayoutEffect, useRef } from 'react';
import { MOBILE_VIEWPORT_QUERY } from '../shared/mobileViewport.js';

const BoardViewport = ({ children, zoomed, onZoomChange, focusTileIndex, onLayoutChange, fullscreen }) => {
    const viewport = useRef(null);
    const focusTile = useRef(focusTileIndex);
    focusTile.current = focusTileIndex;
    useEffect(() => {
        const mobile = window.matchMedia(MOBILE_VIEWPORT_QUERY);
        const update = () => { if (!mobile.matches) onZoomChange(false); };
        update(); mobile.addEventListener('change', update);
        return () => mobile.removeEventListener('change', update);
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
    }, [zoomed, fullscreen, onLayoutChange]);
    return <div className="board-shell" data-zoomed={String(zoomed)}>
        <div className="board-scroller" ref={viewport} role="region" aria-label={zoomed ? 'Увеличенное поле. Прокручивайте, чтобы увидеть остальные клетки' : 'Игровая доска'} tabIndex={zoomed ? 0 : undefined}>
            {children}
        </div>
    </div>;
};

export default BoardViewport;
