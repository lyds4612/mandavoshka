const FullscreenButton = ({ active, pending, disabled, onToggle }) => (
    <button type="button" className="button button-quiet mobile-fullscreen-toggle" onClick={onToggle} disabled={disabled || pending}
        aria-pressed={active} aria-busy={pending} aria-label={active ? 'Выйти из полноэкранного режима' : 'На весь экран'}
        title={active ? 'Выйти из полноэкранного режима' : 'На весь экран — удобно играть, держа телефон боком'}>
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d={active ? 'M3 8H8V3M16 3V8H21M21 16H16V21M8 21V16H3' : 'M8 3H3V8M16 3H21V8M21 16V21H16M8 21H3V16'} />
        </svg><span className="mobile-fullscreen-label">{active ? 'Выйти из полного экрана' : 'Полный экран'}</span>
    </button>
);

export default FullscreenButton;
