const HANDLE_PLATFORMS = [
    { name: 'instagram', label: 'Instagram', prefix: '@', placeholder: 'username', icon: 'https://cdn.simpleicons.org/instagram', color: 'from-purple-500 to-pink-500' },
    { name: 'twitter',   label: 'Twitter / X', prefix: '@', placeholder: 'username', icon: 'https://cdn.simpleicons.org/x',         color: 'from-blue-400 to-blue-500' },
    { name: 'tiktok',    label: 'TikTok',      prefix: '@', placeholder: 'username', icon: 'https://cdn.simpleicons.org/tiktok',     color: 'from-gray-800 to-black' },
];

const URL_PLATFORMS = [
    { name: 'soundcloud', label: 'SoundCloud', placeholder: 'soundcloud.com/username',       icon: 'https://cdn.simpleicons.org/soundcloud', color: 'bg-orange-500' },
    { name: 'spotify',    label: 'Spotify',    placeholder: 'open.spotify.com/artist/…',     icon: 'https://cdn.simpleicons.org/spotify',    color: 'bg-green-500' },
    { name: 'youtube',    label: 'YouTube',    placeholder: 'youtube.com/c/username',         icon: 'https://cdn.simpleicons.org/youtube',    color: 'bg-red-600' },
    { name: 'discord',    label: 'Discord',    placeholder: 'username or invite link',        icon: 'https://cdn.simpleicons.org/discord',    color: 'bg-indigo-500' },
];

function SocialBadge({ color, icon, label }) {
    return (
        <div className={`flex items-center gap-1.5 px-2.5 py-1 ${color.startsWith('bg-') ? color : `bg-gradient-to-br ${color}`} rounded-lg text-white text-xs font-medium`}>
            <img src={icon} className="w-3 h-3" alt="" />
            {label}
        </div>
    );
}

export default function EditSocialTab({ socialLinks, setSocialLinks, saving, onSubmit, inputClass }) {
    const handleChange = e => setSocialLinks(p => ({ ...p, [e.target.name]: e.target.value }));
    const hasAny = Object.values(socialLinks).some(v => v);

    return (
        <form onSubmit={onSubmit} className="space-y-5">
            <div className="glass-panel rounded-2xl p-4 sm:p-6 space-y-4">
                <div>
                    <h2 className="text-base font-semibold text-[var(--text-primary)]">Social Links</h2>
                    <p className="text-sm text-[var(--text-tertiary)] mt-0.5">Connect your profiles so others can find you</p>
                </div>

                {/* Handle platforms */}
                <div className="space-y-3">
                    {HANDLE_PLATFORMS.map(({ name, label, prefix, placeholder, icon, color }) => (
                        <div key={name}>
                            <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                                <span className={`w-5 h-5 bg-gradient-to-br ${color} rounded flex items-center justify-center flex-shrink-0`}>
                                    <img src={icon + '/ffffff'} className="w-3 h-3" alt={label} />
                                </span>
                                {label}
                            </label>
                            <div className="flex items-center bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent transition-[box-shadow,border-color]">
                                <span className="px-3 text-[var(--text-tertiary)] text-sm border-r border-[var(--border-color)] py-3 flex-shrink-0">{prefix}</span>
                                <input type="text" name={name} value={socialLinks[name]} onChange={handleChange}
                                    style={{ fontSize: '16px' }}
                                    className="flex-1 px-3 py-3 bg-transparent text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none text-sm"
                                    placeholder={placeholder} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* URL platforms */}
                <div className="border-t border-[var(--border-color)] pt-4 space-y-3">
                    {URL_PLATFORMS.map(({ name, label, placeholder, icon, color }) => (
                        <div key={name}>
                            <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                                <span className={`w-5 h-5 ${color} rounded flex items-center justify-center flex-shrink-0`}>
                                    <img src={icon + '/ffffff'} className="w-3 h-3" alt={label} />
                                </span>
                                {label}
                            </label>
                            <input type="text" name={name} value={socialLinks[name]} onChange={handleChange}
                                style={{ fontSize: '16px' }} className={inputClass} placeholder={placeholder} />
                        </div>
                    ))}
                </div>

                {/* Preview */}
                {hasAny && (
                    <div className="flex flex-wrap gap-2 pt-3 border-t border-[var(--border-color)]">
                        <p className="w-full text-xs text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Preview</p>
                        {socialLinks.instagram  && <SocialBadge color="from-purple-500 to-pink-500" icon="https://cdn.simpleicons.org/instagram/ffffff"  label="Instagram" />}
                        {socialLinks.twitter    && <SocialBadge color="from-blue-400 to-blue-500"   icon="https://cdn.simpleicons.org/x/ffffff"           label="X" />}
                        {socialLinks.tiktok     && <SocialBadge color="from-gray-800 to-black"      icon="https://cdn.simpleicons.org/tiktok/ffffff"      label="TikTok" />}
                        {socialLinks.soundcloud && <SocialBadge color="bg-orange-500"               icon="https://cdn.simpleicons.org/soundcloud/ffffff"  label="SoundCloud" />}
                        {socialLinks.spotify    && <SocialBadge color="bg-green-500"                icon="https://cdn.simpleicons.org/spotify/ffffff"     label="Spotify" />}
                        {socialLinks.youtube    && <SocialBadge color="bg-red-600"                  icon="https://cdn.simpleicons.org/youtube/ffffff"     label="YouTube" />}
                        {socialLinks.discord    && <SocialBadge color="bg-indigo-500"               icon="https://cdn.simpleicons.org/discord/ffffff"     label="Discord" />}
                    </div>
                )}
            </div>

            <button type="submit" disabled={saving}
                className="w-full py-3 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 disabled:from-gray-700 disabled:to-gray-700 text-white font-semibold rounded-xl transition-[box-shadow,border-color] shadow-lg shadow-primary-500/20">
                {saving ? 'Saving…' : 'Save Social Links'}
            </button>
        </form>
    );
}