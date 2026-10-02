export const Fleur = ({ className = '' }) => (
    <svg className={`fleur ${className}`} viewBox="0 0 80 64" fill="none" aria-hidden="true">
        <path d="M40 3C26 15 29 28 40 40C51 28 54 15 40 3Z" fill="currentColor" />
        <path d="M37 39C30 16 9 20 15 33C18 39 26 37 24 31C31 31 31 42 36 46M43 39C50 16 71 20 65 33C62 39 54 37 56 31C49 31 49 42 44 46" stroke="currentColor" strokeWidth="3" />
        <path d="M25 43H55M29 48H51M40 48L34 59L40 55L46 59L40 48Z" stroke="currentColor" strokeWidth="2.5" />
        <path d="M7 43C14 51 20 52 29 50M73 43C66 51 60 52 51 50M40 10V36" stroke="currentColor" strokeWidth="1" />
    </svg>
);

export const CornerOrnament = ({ className = '' }) => (
    <svg className={`corner-ornament ${className}`} viewBox="0 0 100 100" fill="none" aria-hidden="true">
        <path d="M7 92V7H92M13 76V13H76" stroke="currentColor" strokeWidth="2" />
        <path d="M18 18C45 18 54 32 45 43C38 53 24 47 26 37C28 28 40 31 36 37C48 31 33 20 18 18Z" fill="currentColor" />
        <path d="M18 18C18 45 32 54 43 45C53 38 47 24 37 26C28 28 31 40 37 36C31 48 20 33 18 18Z" fill="currentColor" />
        <path d="M50 18C64 33 73 33 82 20C64 20 72 13 89 17M18 50C33 64 33 73 20 82C20 64 13 72 17 89" stroke="currentColor" strokeWidth="2" />
        <path d="M49 47C54 51 54 60 46 66C38 72 31 64 37 60C43 56 48 62 44 64M47 49C51 54 60 54 66 46C72 38 64 31 60 37C56 43 62 48 64 44" stroke="currentColor" strokeWidth="2" />
        <path d="M21 21L12 12M51 51L59 59M59 59L55 69L69 55L59 59Z" stroke="currentColor" strokeWidth="1.5" />
    </svg>
);

export const DiceIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.5" transform="rotate(-10 12 12)" />
        <circle cx="8" cy="9" r="1.2" fill="currentColor" /><circle cx="16" cy="8" r="1.2" fill="currentColor" />
        <circle cx="12" cy="12" r="1.2" fill="currentColor" /><circle cx="8" cy="16" r="1.2" fill="currentColor" /><circle cx="16" cy="15" r="1.2" fill="currentColor" />
    </svg>
);
