import { useEffect, useState } from 'react';
import api from '../../services/api';
import { useToast } from './Toast';

const PREFS_CONFIG = [
{
key: 'collaboration_request',
label: 'Collaboration Requests',
desc: 'When someone wants to collaborate on your track',
icon: '🤝',
},
{
key: 'collaboration_response',
label: 'Collaboration Responses',
desc: 'When your request is accepted or declined',
icon: '✅',
},
{
key: 'submission',
label: 'New Submissions',
desc: 'When a collaborator submits a new version of your track',
icon: '🎵',
},
{
key: 'comment',
label: 'Comments',
desc: 'When someone comments on your submissions',
icon: '💬',
},
{
key: 'vote',
label: 'Votes',
desc: 'When someone votes on your submission',
icon: '❤️',
},
{
key: 'message',
label: 'Direct Messages',
desc: 'When you receive a new message',
icon: '✉️',
},
];

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
}, [ toast ]);

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
    <div className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl">
    <div>
        <p className="font-semibold text-[var(--text-primary)]">Email Notifications</p>
        <p className="text-sm text-[var(--text-tertiary)] mt-0.5">
        Receive email updates about activity on TrackBackAI
        </p>
    </div>
    <button
        onClick={() => setPrefs(prev => ({ ...prev, enabled: !prev.enabled }))}
        className={`relative w-12 h-6 rounded-full focus:outline-none ${
        prefs.enabled ? 'bg-primary-500' : 'bg-[var(--bg-tertiary)]'
        }`}
    >
        <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
        prefs.enabled ? 'translate-x-6' : 'translate-x-0'
        }`} />
    </button>
    </div>

    {/* Per-type toggles */}
    <div className={`space-y-3 transition-opacity duration-200 ${prefs.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
    <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)] px-1">
        Notify me by email when...
    </p>
    {PREFS_CONFIG.map(({ key, label, desc, icon }) => (
        <div
        key={key}
        className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl hover:border-primary-500/30 transition-colors"
        >
        <div className="flex items-center gap-3">
            <span className="text-xl">{icon}</span>
            <div>
            <p className="font-medium text-[var(--text-primary)] text-sm">{label}</p>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{desc}</p>
            </div>
        </div>
        <button
            onClick={() => toggle(key)}
            className={`relative w-10 h-5 rounded-full  focus:outline-none flex-shrink-0 ${
            prefs[key] ? 'bg-primary-500' : 'bg-[var(--bg-tertiary)]'
            }`}
        >
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
            prefs[key] ? 'translate-x-5' : 'translate-x-0'
            }`} />
        </button>
        </div>
    ))}
    </div>

    {/* Save button */}
    <button
    onClick={save}
    disabled={saving}
    className="w-full py-3 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-semibold rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed"
    >
    {saving ? 'Saving...' : 'Save Email Preferences'}
    </button>
</div>
);
}