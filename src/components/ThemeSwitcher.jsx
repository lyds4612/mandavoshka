import { useEffect, useState } from 'react';
import './ThemeSwitcher.css';

const STORAGE_KEY = 'mandavoshka.visual-theme.v1';
const THEMES = [{ id: 'classic', name: 'Классика' }, { id: 'prison', name: 'Тюрьма' }];

export const useVisualTheme = () => {
    const [theme, setTheme] = useState(() => {
        try {
            return localStorage.getItem(STORAGE_KEY) === 'prison' ? 'prison' : 'classic';
        } catch {
            return 'classic';
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, theme);
        } catch {
            // Switching still works when browser storage is unavailable.
        }
    }, [theme]);

    return [theme, setTheme];
};

export const PrisonEmblem = ({ className = '' }) => (
    <svg className={`prison-emblem ${className}`} viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <rect x="6" y="5" width="36" height="38" rx="2" stroke="currentColor" strokeWidth="2" />
        <path d="M16 7V41M24 7V41M32 7V41M8 16H40M8 32H40" stroke="currentColor" strokeWidth="2" />
        <circle cx="10" cy="9" r="1" fill="currentColor" /><circle cx="38" cy="9" r="1" fill="currentColor" />
        <circle cx="10" cy="39" r="1" fill="currentColor" /><circle cx="38" cy="39" r="1" fill="currentColor" />
    </svg>
);

const ThemeSwitcher = ({ theme, onChange }) => (
    <div className="theme-switch" role="group" aria-label="Оформление игры">
        {THEMES.map(({ id, name }) => (
            <button key={id} type="button" className="theme-choice" aria-pressed={theme === id} onClick={() => onChange(id)}>
                {id === 'prison' ? <PrisonEmblem /> : <span className="theme-choice-suit" aria-hidden="true">♣</span>}
                {name}
            </button>
        ))}
    </div>
);

export default ThemeSwitcher;
