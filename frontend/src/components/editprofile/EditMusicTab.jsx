export default function EditMusicTab({ formData, setFormData, saving, onSubmit, inputClass }) {
    const previewGenres = formData.preferred_genres.split(',').map(s => s.trim()).filter(Boolean);

    return (
        <form onSubmit={onSubmit} className="space-y-5">
            <div className="glass-panel rounded-2xl p-4 sm:p-6 space-y-5">
                <h2 className="text-base font-semibold text-[var(--text-primary)]">Music Details</h2>

                <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Preferred Genres</label>
                    <input type="text" name="preferred_genres" value={formData.preferred_genres}
                        onChange={e => setFormData(p => ({ ...p, preferred_genres: e.target.value }))}
                        style={{ fontSize: '16px' }} className={inputClass}
                        placeholder="Electronic, Hip-Hop, Rock, Jazz" />
                    <p className="text-xs text-[var(--text-tertiary)] mt-1.5">Separate with commas</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Equipment / Software</label>
                    <input type="text" name="equipment" value={formData.equipment}
                        onChange={e => setFormData(p => ({ ...p, equipment: e.target.value }))}
                        style={{ fontSize: '16px' }} className={inputClass}
                        placeholder="Ableton Live, MIDI Keyboard, Guitar, Microphone" />
                    <p className="text-xs text-[var(--text-tertiary)] mt-1.5">Your DAW and instruments, separated by commas</p>
                </div>

                {previewGenres.length > 0 && (
                    <div>
                        <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider mb-2">Preview</p>
                        <div className="flex flex-wrap gap-1.5">
                            {previewGenres.map((g, i) => (
                                <span key={i} className="px-3 py-1 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-full text-sm text-[var(--text-secondary)]">{g}</span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <button type="submit" disabled={saving}
                className="w-full py-3 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 disabled:from-gray-700 disabled:to-gray-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-primary-500/20">
                {saving ? 'Saving…' : 'Save Details'}
            </button>
        </form>
    );
}