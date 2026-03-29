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

// Uses hidden checkbox + styled div — same pattern as the collab toggle in EditProfileTab.
// The <label> makes the checkbox the real interactive element so iOS registers first tap correctly.
function Toggle({ checked, onChange, large = false }) {
const trackW = large ? 'w-12 h-7' : 'w-10 h-6';
const knobW  = large ? 'w-5 h-5'  : 'w-4 h-4';
const onPos  = large ? 'translate-x-6' : 'translate-x-5';
const offPos = 'translate-x-1';

return (
<label className="relative flex-shrink-0 cursor-pointer" style={{ minHeight: 'auto' }}>
    <input
    type="checkbox"
    checked={checked}
    onChange={onChange}
    className="sr-only"
    />
    <div className={`${trackW} rounded-full ${checked ? 'bg-primary-500' : 'bg-[var(--bg-tertiary)]'}`}>
    <div className={`absolute top-1 ${knobW} rounded-full bg-white shadow transition-transform duration-200 ${checked ? onPos : offPos}`} />
    </div>
</label>
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
    <div className="space-y-6">

      {/* Master toggle */}
    <label className="flex items-center justify-between p-4 bg-[var(--bg-tertiary)]/40 rounded-xl border border-[var(--border-color)] cursor-pointer">
    <div className="flex-1 min-w-0 pr-4">
        <p className="font-semibold text-[var(--text-primary)]">Email Notifications</p>
        <p className="text-sm text-[var(--text-tertiary)] mt-0.5">
        Receive email updates about activity on TrackBackAI
        </p>
    </div>
    <Toggle checked={!!prefs.enabled} onChange={() => toggle('enabled')} large />
    </label>

      {/* Per-type toggles */}
    <div className={`space-y-3 ${prefs.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
    <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)] px-1">
        Notify me by email when...
    </p>
    {PREFS_CONFIG.map(({ key, label, desc, icon }) => (
        <label
        key={key}
        className="flex items-center justify-between p-4 bg-[var(--bg-tertiary)]/40 rounded-xl border border-[var(--border-color)] cursor-pointer"
        >
        <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
            <span className="text-xl flex-shrink-0">{icon}</span>
            <div className="min-w-0">
            <p className="font-medium text-[var(--text-primary)] text-sm">{label}</p>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5 leading-snug">{desc}</p>
            </div>
        </div>
        <Toggle checked={!!prefs[key]} onChange={() => toggle(key)} />
        </label>
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