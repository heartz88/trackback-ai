export default function MessagesLoading() {
return (
<div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
    <div className="text-center">
    <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
    <p className="text-[var(--text-secondary)]">Loading messages...</p>
    </div>
</div>
);
}