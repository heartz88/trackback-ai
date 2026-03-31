import { useNavigate } from 'react-router-dom';

/**
 * Consistent back button used across all detail/action pages.
 * - `to` prop: navigate to a specific route (preferred — deterministic)
 * - No `to` prop: browser history back (fallback)
 * - `label` prop: optional text label, defaults to "Back"
 */
export default function BackButton({ to, label = 'Back', className = '' }) {
const navigate = useNavigate();

const handleClick = () => {
    if (to) navigate(to);
    else navigate(-1);
};

return (
    <button
    onClick={handleClick}
    className={`inline-flex items-center gap-1.5 text-sm text-[var(--text-tertiary)] font-medium px-2 py-1.5 rounded-lg active:bg-[var(--bg-tertiary)] ${className}`}
    >
    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
    {label}
    </button>
);
}