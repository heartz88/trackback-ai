export default function ConnectionStatus({ 
  isConnected, 
  connectionError, 
  onlineUsersCount,
  onReconnect 
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-primary-500 animate-pulse' : 'bg-red-500'}`}></div>
      <p className="text-[var(--text-secondary)]">
        {isConnected ? 'Connected' : 'Disconnected'}
        {connectionError && ` - ${connectionError}`}
      </p>
      <span className="text-[var(--text-tertiary)] text-sm">
        • {onlineUsersCount} users online
      </span>
      {!isConnected && (
        <button
          onClick={onReconnect}
          className="ml-auto px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-medium rounded-lg transition-[box-shadow,border-color] text-sm"
        >
          Reconnect
        </button>
      )}
    </div>
  );
}