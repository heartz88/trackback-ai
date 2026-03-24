export default function ProfileGenres({ genres }) {
return (
<div className="mb-4">
    <h3 className="text-sm font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">
    Preferred Genres
    </h3>
    <div className="flex flex-wrap gap-2">
    {genres.map((genre, i) => (
        <span 
        key={i} 
        className="px-3 py-1.5 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-full text-sm hover:border-primary-500/40"
        >
        {genre}
        </span>
    ))}
    </div>
</div>
);
}