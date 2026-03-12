export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
      <div className="music-loader">
        {[...Array(5)].map((_, i) => (
          <span key={i} className="music-loader-bar" />
        ))}
      </div>
    </div>
  );
}