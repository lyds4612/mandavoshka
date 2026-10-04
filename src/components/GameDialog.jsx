import { useEffect, useId, useRef } from 'react';
import './GameDialog.css';

const GameDialog = ({ open, title, onClose, children, className = '' }) => {
    const dialog = useRef(null), titleId = useId();
    useEffect(() => {
        if (open && !dialog.current.open) dialog.current.showModal();
        else if (!open && dialog.current.open) dialog.current.close();
    }, [open]);
    return <dialog ref={dialog} className={`game-dialog ${className}`} aria-labelledby={titleId}
        onCancel={event => { event.preventDefault(); event.stopPropagation(); onClose(); }} onClose={onClose}
        onClick={event => { if (event.target === dialog.current) onClose(); }}>
        <header className="game-dialog-heading"><h2 id={titleId}>{title}</h2>
            <button type="button" className="game-dialog-close" aria-label="Закрыть" onClick={onClose}>×</button></header>
        {children}
    </dialog>;
};
export default GameDialog;
