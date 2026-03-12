const SocialIcon = ({ href, bgColor, icon, label }) => {
  if (!href) return null;
  return (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer" 
      className={`w-10 h-10 ${bgColor} rounded-xl flex items-center justify-center hover:scale-110 transition-transform shadow-lg`}
      title={label}
    >
      <img src={icon} className="w-5 h-5" alt={label} />
    </a>
  );
};

export default function SocialLinks({ links }) {
  if (!links || !Object.values(links).some(v => v)) return null;

  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-3">
        Connect
      </h3>
      <div className="flex flex-wrap gap-3">
        <SocialIcon 
          href={links.instagram && `https://instagram.com/${links.instagram}`}
          bgColor="bg-gradient-to-br from-purple-500 to-pink-500"
          icon="https://cdn.simpleicons.org/instagram/ffffff"
          label="Instagram"
        />
        <SocialIcon 
          href={links.twitter && `https://twitter.com/${links.twitter}`}
          bgColor="bg-blue-400"
          icon="https://cdn.simpleicons.org/x/ffffff"
          label="X"
        />
        <SocialIcon 
          href={links.soundcloud && (links.soundcloud.startsWith('http') ? links.soundcloud : `https://${links.soundcloud}`)}
          bgColor="bg-orange-500"
          icon="https://cdn.simpleicons.org/soundcloud/ffffff"
          label="SoundCloud"
        />
        <SocialIcon 
          href={links.spotify && links.spotify}
          bgColor="bg-green-500"
          icon="https://cdn.simpleicons.org/spotify/ffffff"
          label="Spotify"
        />
        <SocialIcon 
          href={links.youtube && links.youtube}
          bgColor="bg-red-600"
          icon="https://cdn.simpleicons.org/youtube/ffffff"
          label="YouTube"
        />
        <SocialIcon 
          href={links.discord && (links.discord.startsWith('https') ? links.discord : `https://discord.com/users/${links.discord}`)}
          bgColor="bg-indigo-500"
          icon="https://cdn.simpleicons.org/discord/ffffff"
          label="Discord"
        />
        <SocialIcon 
          href={links.tiktok && `https://tiktok.com/@${links.tiktok}`}
          bgColor="bg-black"
          icon="https://cdn.simpleicons.org/tiktok/ffffff"
          label="TikTok"
        />
      </div>
    </div>
  );
}