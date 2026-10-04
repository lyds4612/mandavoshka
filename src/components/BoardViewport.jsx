import { useLayoutEffect, useRef } from 'react';

const BoardViewport = ({ children, onLayoutChange }) => {
    const viewport = useRef(null);
    useLayoutEffect(() => {
        const observer = new ResizeObserver(onLayoutChange);
        observer.observe(viewport.current);
        onLayoutChange();
        return () => observer.disconnect();
    }, [onLayoutChange]);
    return <div className="board-shell" ref={viewport}>
        <div className="board-scroller" role="region" aria-label="Игровая доска">{children}</div>
    </div>;
};
export default BoardViewport;
