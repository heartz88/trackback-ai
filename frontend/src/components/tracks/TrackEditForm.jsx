import { useState } from 'react';
import api from '../../services/api';
import { useToast } from '../common/Toast';

const inputCls = [
'w-full px-3 py-2.5 rounded-xl text-sm',
'bg-[var(--bg-primary)] border border-[var(--border-color)]',
'text-[var(--text-primary)] placeholder-[var(--text-tertiary)]',
'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
'transition-[box-shadow,border-color]',
].join(' ');

export default function TrackEditForm({ track, onSave, onCancel }) {
const toast = useToast();
const [saving, setSaving] = useState(false);
const [form, setForm] = useState({
title:          track.title || '',
description:    track.description || '',
genre:          track.genre || '',
desired_skills: Array.isArray(track.desired_skills)
                    ? track.desired_skills.join(', ')
                    : track.desired_skills || '',
});

const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

const handleSave = async () => {
if (!form.title.trim()) { toast.error('Title cannot be empty'); return; }
setSaving(true);
try {
    const res = await api.put(`/tracks/${track.id}`, {
    title:          form.title.trim(),
    description:    form.description.trim(),
    genre:          form.genre.trim(),
    desired_skills: form.desired_skills,
    });
    toast.success('Track updated ✓');
    onSave(res.data.track);
} catch (err) {
    toast.error(err.response?.data?.error?.message || 'Failed to save changes');
} finally {
    setSaving(false);
}
};

return (
<div className="mt-4 p-4 bg-[var(--bg-primary)] border border-primary-500/30 rounded-xl space-y-3">
    <p className="text-xs font-semibold text-primary-400 uppercase tracking-wider mb-1">Editing track</p>

    <div>
    <label className="block text-xs text-[var(--text-tertiary)] mb-1">Title *</label>
    <input type="text" value={form.title} onChange={set('title')} maxLength={100}
        className={inputCls} placeholder="Track title" disabled={saving} />
    </div>

    <div>
    <label className="block text-xs text-[var(--text-tertiary)] mb-1">Description</label>
    <textarea value={form.description} onChange={set('description')} rows={3} maxLength={500}
        className={`${inputCls} resize-none`} placeholder="Describe your track, mood, inspiration..."
        disabled={saving} />
    <p className="text-xs text-[var(--text-tertiary)] text-right mt-0.5">{form.description.length}/500</p>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
    <div>
        <label className="block text-xs text-[var(--text-tertiary)] mb-1">Genre</label>
        <input type="text" value={form.genre} onChange={set('genre')} maxLength={50}
        className={inputCls} placeholder="e.g. Trap, Lo-fi, House" disabled={saving} />
    </div>
    <div>
        <label className="block text-xs text-[var(--text-tertiary)] mb-1">
        Desired skills <span className="font-normal ml-1">(comma-separated)</span>
        </label>
        <input type="text" value={form.desired_skills} onChange={set('desired_skills')}
        className={inputCls} placeholder="e.g. vocals, mixing, guitar" disabled={saving} />
    </div>
    </div>

    <div className="flex gap-2 pt-1">
    <button onClick={handleSave} disabled={saving || !form.title.trim()}
        className="flex-1 py-2 bg-primary-600 hover:bg-primary-500 disabled:opacity-50
                    disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl
                    transition-[box-shadow,border-color]">
        {saving ? 'Saving…' : 'Save changes'}
    </button>
    <button onClick={onCancel} disabled={saving}
        className="px-4 py-2 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)]
                    text-[var(--text-secondary)] text-sm rounded-xl border border-[var(--border-color)]
                    transition-[box-shadow,border-color]">
        Cancel
    </button>
    </div>
</div>
);
}