import { useEffect, useState } from 'react';

let _addToast = null;

export function useToast() {
return {
    success: (msg) => _addToast?.({ msg, type: 'success' }),
    error:   (msg) => _addToast?.({ msg, type: 'error' }),
    info:    (msg) => _addToast?.({ msg, type: 'info' }),
};
}

export function ToastContainer() {
const [toasts, setToasts] = useState([]);

useEffect(() => {
    _addToast = ({ msg, type }) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
    };
    return () => { _addToast = null; };
}, []);

const icons = {
    success: (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
    ),
    error: (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
    </svg>
    ),
    info: (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    ),
};

const colours = {
    success: { bg: 'bg-green-500/15 border-green-500/40', text: 'text-green-400', icon: 'text-green-400' },
    error:   { bg: 'bg-red-500/15 border-red-500/40',     text: 'text-red-400',   icon: 'text-red-400'   },
    info:    { bg: 'bg-primary-500/15 border-primary-500/40', text: 'text-primary-300', icon: 'text-primary-400' },
};

if (toasts.length === 0) return null;

return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 360 }}>
    {toasts.map(({ id, msg, type }) => {
        const c = colours[type];
        return (
        <div
            key={id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-sm shadow-xl ${c.bg} ${c.text}`}
            style={{ animation: 'slideInRight 0.2s ease', fontSize: 14, fontWeight: 500 }}
        >
            <span className={c.icon}>{icons[type]}</span>
            <span style={{ flex: 1 }}>{msg}</span>
        </div>
        );
    })}
    <style>{`@keyframes slideInRight { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }`}</style>
    </div>
);
}
let _setModal = null;

export function useConfirm() {
return (opts) =>
    new Promise((resolve) => {
    _setModal?.({ ...opts, resolve });
    });
}

export function ConfirmModal() {
const [modal, setModal] = useState(null);

useEffect(() => {
    _setModal = setModal;
    return () => { _setModal = null; };
}, []);

if (!modal) return null;

const { title, message, confirmText = 'Confirm', cancelText = 'Cancel', danger = false, resolve } = modal;

const answer = (val) => { setModal(null); resolve(val); };

return (
    <div
    style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
    onClick={() => answer(false)}
    >
    {/* Backdrop */}
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />

    {/* Panel */}
    <div
        onClick={e => e.stopPropagation()}
        className="glass-panel"
        style={{ position: 'relative', width: '100%', maxWidth: 400, borderRadius: 16, padding: 24, animation: 'scaleIn 0.15s ease' }}
    >
        {/* Icon */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
        <div style={{
            width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: danger ? 'rgba(239,68,68,0.15)' : 'rgba(99,102,241,0.15)',
        }}>
            {danger ? (
            <svg style={{ width: 24, height: 24, color: '#ef4444' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            ) : (
            <svg style={{ width: 24, height: 24, color: '#6366f1' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            )}
        </div>
        </div>

        <h3 style={{ margin: '0 0 8px', textAlign: 'center', fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h3>
        {message && <p style={{ margin: '0 0 24px', textAlign: 'center', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{message}</p>}

        <div style={{ display: 'flex', gap: 10 }}>
        <button
            onClick={() => answer(false)}
            className="btn-secondary"
            style={{ flex: 1, textAlign: 'center' }}
        >
            {cancelText}
        </button>
        <button
            onClick={() => answer(true)}
            style={{
            flex: 1, padding: '10px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: 14, fontFamily: 'inherit',
            background: danger ? '#ef4444' : 'var(--accent-primary)',
            color: '#fff',
            }}
        >
            {confirmText}
        </button>
        </div>
    </div>
    <style>{`@keyframes scaleIn { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }`}</style>
    </div>
);
}