import { useEffect, useState } from 'react';
import api from '../../services/api';
import { useToast } from './Toast';

const PREFS_CONFIG = [
{ key: 'collaboration_request', label: 'Collaboration Requests', desc: 'When someone wants to collaborate on your track', icon: '🤝' },
{ key: 'collaboration_response', label: 'Collaboration Responses', desc: 'When your request is accepted or declined', icon: '✅' },
{ key: 'submission', label: 'New Submissions', desc: 'When a collaborator submits a new version of your track', icon: '🎵' },
{ key: 'comment', label: 'Comments', desc: 'When someone comments on your submissions', icon: '💬' },
{ key: 'vote', label: 'Votes', desc: 'When someone votes on your submission', icon: '❤️' },
{ key: 'message', label: 'Direct Messages', desc: 'When you receive a new message', icon: '✉️' },
];


function Toggle({ checked, onChange, large = false }) {
const width  = large ? 56 : 48;
const height = large ? 28 : 24;
const knobSize = large ? 20 : 16;
const knobOff = 4;
const knobOn  = width - knobSize - knobOff;

return (
<button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={onChange}
    style={{
    position: 'relative',
    width,
    height,
    borderRadius: height,
    flexShrink: 0,
    minHeight: 'auto',
    background: checked ? 'var(--accent-primary, #14b8a6)' : 'var(--bg-tertiary)',
    border: checked ? 'none' : '1px solid var(--border-color)',
    // Track colour animates via inline style — safe on iOS
    transition: 'background 0.2s ease',
    cursor: 'pointer',
    outline: 'none',
    }}
>
    <span
    style={{
        position: 'absolute',
        top: knobOff,
        width: knobSize,
        height: knobSize,
        background: '#fff',
        borderRadius: '50%',
        boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
        // Knob slides via inline transform — not a CSS class transition
        transform: `translateX(${checked ? knobOn : knobOff}px)`,
        transition: 'transform 0.2s ease',
    }}
    />
</button>
);
}

export default function EmailNotificationSettings() {
const toast = useToast();
const [prefs, setPrefs] = useState(null);
const [loading, setLoading] = useState(true);
const [saving, setSaving] = useState(false);

useEffect(() => {
api.get('/notifications/email-preferences')
    .then(r => setPrefs(r.data.preferences))
    .catch(() => toast.error('Failed to load email preferences'))
    .finally(() => setLoading(false));
}, []);

const toggle = (key) => {
setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
};

const save = async () => {
setSaving(true);
try {
    await api.put('/notifications/email-preferences', prefs);
    toast.success('Email preferences saved');
} catch {
    toast.error('Failed to save preferences');
} finally {
    setSaving(false);
}
};

if (loading) {
return (
    <div className="flex items-center justify-center py-12">
    <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
);
}

if (!prefs) return null;

return (
<div className="space-y-6">
    {/* Master toggle */}
    <div className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl gap-4">
    <div className="flex-1 min-w-0">
        <p className="font-semibold text-[var(--text-primary)]">Email Notifications</p>
        <p className="text-sm text-[var(--text-tertiary)] mt-0.5">
        Receive email updates about activity on TrackBackAI
        </p>
    </div>
    <Toggle checked={!!prefs.enabled} onChange={() => toggle('enabled')} large />
    </div>

    {/* Per-type toggles */}
    <div className={`space-y-3 ${prefs.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
    <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)] px-1">
        Notify me by email when...
    </p>
    {PREFS_CONFIG.map(({ key, label, desc, icon }) => (
        <div
        key={key}
        className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl gap-4"
        >
        <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="text-xl flex-shrink-0">{icon}</span>
            <div className="min-w-0">
            <p className="font-medium text-[var(--text-primary)] text-sm">{label}</p>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5 leading-snug">{desc}</p>
            </div>
        </div>
        <Toggle checked={!!prefs[key]} onChange={() => toggle(key)} />
        </div>
    ))}
    </div>

    {/* Save */}
    <button
    onClick={save}
    disabled={saving}
    className="w-full py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold rounded-xl disabled:opacity-60 disabled:cursor-not-allowed"
    >
    {saving ? 'Saving...' : 'Save Email Preferences'}
    </button>
</div>
);
}