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

// Toggle component — self-contained so min-height rule never affects it
function Toggle({ on, onToggle }) {
return (
<div
    onClick={onToggle}
    role="switch"
    aria-checked={on}
    style={{
    minHeight: 'auto',
    width: 48,
    height: 26,
    borderRadius: 13,
    backgroundColor: on ? '#14B8A6' : 'var(--bg-tertiary)',
    position: 'relative',
    flexShrink: 0,
    cursor: 'pointer',
    border: '2px solid',
    borderColor: on ? '#14B8A6' : 'var(--border-color)',
    transition: 'background-color 0.2s ease, border-color 0.2s ease',
    }}>
    
    <span style={{
    position: 'absolute',
    top: 2,
    left: on ? 22 : 2,
    width: 18,
    height: 18,
    borderRadius: '50%',
    backgroundColor: '#fff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
    transition: 'left 0.2s ease',
    }} />
</div>
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
}, [toast]);

const toggle = (key) => setPrefs(prev => ({ ...prev, [key]: !prev[key] }));

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

if (loading) return (
<div className="flex items-center justify-center py-12">
    <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
</div>
);

if (!prefs) return null;

return (
<div className="space-y-4">
    {/* Master toggle */}
    <div className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl gap-4">
    <div className="flex-1 min-w-0">
        <p className="font-semibold text-[var(--text-primary)]">Email Notifications</p>
        <p className="text-sm text-[var(--text-tertiary)] mt-0.5">
        Receive email updates about activity on TrackBackAI
        </p>
    </div>
    <Toggle on={!!prefs.enabled} onToggle={() => setPrefs(prev => ({ ...prev, enabled: !prev.enabled }))} />
    </div>

    {/* Per-type toggles */}
    <div className={`space-y-2 ${prefs.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
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
        <Toggle on={!!prefs[key]} onToggle={() => toggle(key)} />
        </div>
    ))}
    </div>

    {/* Save */}
    <button
    onClick={save}
    disabled={saving}
    className="w-full py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold rounded-xl shadow-lg shadow-primary-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
    >
    {saving ? 'Saving...' : 'Save Email Preferences'}
    </button>
</div>
);
}