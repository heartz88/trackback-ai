import { useRef } from 'react';
import { Link } from 'react-router-dom';

export default function EditProfileTab({ formData, setFormData, avatarUrl, setAvatarUrl, uploadingAvatar, saving, onSubmit, onAvatarChange, onRemoveAvatar, inputClass }) {
    const avatarInputRef = useRef(null);

    return (
        <form onSubmit={onSubmit} className="space-y-5">
            {/* Avatar card */}
            <div className="glass-panel rounded-2xl p-4 sm:p-6">
                <h2 className="text-base font-semibold text-[var(--text-primary)] mb-4">Profile Picture</h2>
                <div className="flex items-center gap-4">
                    <div className="relative flex-shrink-0">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="Avatar"
                                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover ring-4 ring-primary-500/30 shadow-xl"
                                onError={() => setAvatarUrl('')} />
                        ) : (
                            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-3xl font-bold ring-4 ring-primary-500/30 shadow-xl">
                                {formData.username?.[0]?.toUpperCase() || '?'}
                            </div>
                        )}
                        {uploadingAvatar && (
                            <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                                <svg className="w-6 h-6 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                                </svg>
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm text-[var(--text-secondary)] mb-3">JPEG, PNG, WebP · max 5MB</p>
                        <input ref={avatarInputRef} type="file" accept="image/*" onChange={onAvatarChange} className="hidden" />
                        <div className="flex flex-wrap gap-2">
                            <button type="button" onClick={() => avatarInputRef.current?.click()}
                                disabled={uploadingAvatar}
                                className="px-4 py-2 bg-primary-600 hover:bg-primary-500 disabled:bg-gray-700 text-white text-sm font-semibold rounded-xl transition-[box-shadow,border-color]">
                                {uploadingAvatar ? 'Uploading…' : 'Upload Photo'}
                            </button>
                            {avatarUrl && (
                                <button type="button" onClick={onRemoveAvatar} disabled={uploadingAvatar}
                                    className="px-4 py-2 bg-[var(--bg-tertiary)] hover:bg-red-500/10 text-[var(--text-secondary)] hover:text-red-400 text-sm font-semibold rounded-xl transition-[box-shadow,border-color] border border-[var(--border-color)] disabled:opacity-50">
                                    Remove
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Basic info */}
            <div className="glass-panel rounded-2xl p-4 sm:p-6 space-y-4">
                <h2 className="text-base font-semibold text-[var(--text-primary)]">Basic Information</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Username <span className="text-red-400">*</span></label>
                        <input type="text" name="username" value={formData.username}
                            onChange={e => setFormData(p => ({ ...p, username: e.target.value }))}
                            style={{ fontSize: '16px' }} className={inputClass} required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Email <span className="text-red-400">*</span></label>
                        <input type="email" name="email" value={formData.email}
                            onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                            style={{ fontSize: '16px' }} className={inputClass} required />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Bio</label>
                    <textarea name="bio" value={formData.bio}
                        onChange={e => setFormData(p => ({ ...p, bio: e.target.value }))}
                        rows="4" style={{ fontSize: '16px' }} className={inputClass + ' resize-none'}
                        placeholder="Tell others about yourself, your music style, what you're working on…" />
                    <p className="text-xs text-[var(--text-tertiary)] mt-1.5">A brief description about yourself and your music</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Skills</label>
                    <input type="text" name="skills" value={formData.skills}
                        onChange={e => setFormData(p => ({ ...p, skills: e.target.value }))}
                        style={{ fontSize: '16px' }} className={inputClass}
                        placeholder="mixing, mastering, vocals, guitar, production" />
                    <p className="text-xs text-[var(--text-tertiary)] mt-1.5">Separate with commas</p>
                </div>

                {/* Collab toggle */}
                <label className="flex items-center gap-3 p-3 sm:p-4 bg-[var(--bg-tertiary)]/40 rounded-xl border border-[var(--border-color)] cursor-pointer hover:border-primary-500/40 transition-[box-shadow,border-color]">
                    <div className="relative flex-shrink-0">
                        <input type="checkbox" checked={formData.looking_for_collab}
                            onChange={e => setFormData(p => ({ ...p, looking_for_collab: e.target.checked }))}
                            className="sr-only" />
                        <div className={`w-10 h-6 rounded-full ${formData.looking_for_collab ? 'bg-primary-500' : 'bg-[var(--bg-tertiary)]'}`}>
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${formData.looking_for_collab ? 'translate-x-5' : 'translate-x-1'}`} />
                        </div>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">Available for collaborations</p>
                        <p className="text-xs text-[var(--text-tertiary)]">Show a green badge on your profile</p>
                    </div>
                </label>
            </div>

            <div className="flex gap-3">
                <button type="submit" disabled={saving}
                    className="flex-1 py-3 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 disabled:from-gray-700 disabled:to-gray-700 text-white font-semibold rounded-xl transition-[box-shadow,border-color] shadow-lg shadow-primary-500/20 disabled:shadow-none">
                    {saving ? 'Saving…' : 'Save Changes'}
                </button>
                <Link to={`/profile/${formData.username}`}
                    className="px-6 py-3 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] font-semibold rounded-xl transition-[box-shadow,border-color] border border-[var(--border-color)] text-center">
                    Cancel
                </Link>
            </div>
        </form>
    );
}