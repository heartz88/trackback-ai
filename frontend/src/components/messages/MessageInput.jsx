const SendIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

export default function MessageInput({ 
  value, 
  onChange, 
  onSubmit, 
  isConnected,
  placeholder,
  disabled 
}) {
  return (
    <form onSubmit={onSubmit} className="p-3 border-t border-[var(--border-color)] bg-[var(--bg-secondary)] flex-shrink-0">
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={onChange}
          placeholder={isConnected ? placeholder : "Connecting..."}
          className="flex-1 px-4 py-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-[box-shadow,border-color] disabled:opacity-50"
          disabled={!isConnected || disabled}
        />
        <button
          type="submit"
          disabled={!value.trim() || !isConnected || disabled}
          className={`px-4 py-2.5 text-white font-semibold rounded-xl transition-[box-shadow,border-color] shadow-lg flex items-center justify-center ${
            !value.trim() || !isConnected || disabled
              ? 'bg-gray-600 cursor-not-allowed opacity-50'
              : 'bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 shadow-primary-500/20'
          }`}
        >
          <SendIcon />
        </button>
      </div>
    </form>
  );
}