const SendIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const MAX_LENGTH = 2000;

export default function MessageInput({
  value,
  onChange,
  onSubmit,
  isConnected,
  placeholder,
  disabled
}) {
  const remaining = MAX_LENGTH - (value?.length || 0);
  const isNearLimit = remaining <= 100;
  const isAtLimit = remaining <= 0;

  return (
    <form onSubmit={onSubmit} className="p-3 border-t border-[var(--border-color)] bg-[var(--bg-secondary)] flex-shrink-0">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={value}
            onChange={onChange}
            maxLength={MAX_LENGTH}
            placeholder={isConnected ? placeholder : 'Connecting...'}
            className="w-full px-4 py-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-[box-shadow,border-color] disabled:opacity-50"
            disabled={!isConnected || disabled}
          />
          {/* Character counter — only visible near limit */}
          {isNearLimit && (
            <span
              className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium pointer-events-none ${
                isAtLimit ? 'text-red-400' : 'text-yellow-400'
              }`}
            >
              {remaining}
            </span>
          )}
        </div>
        <button
          type="submit"
          disabled={!value?.trim() || !isConnected || disabled || isAtLimit}
          className={`px-4 py-2.5 text-white font-semibold rounded-xl transition-[box-shadow,border-color] shadow-lg flex items-center justify-center ${
            !value?.trim() || !isConnected || disabled || isAtLimit
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