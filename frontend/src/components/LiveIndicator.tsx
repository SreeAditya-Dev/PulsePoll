

interface LiveIndicatorProps {
  isConnected: boolean;
  viewerCount: number;
}

export function LiveIndicator({ isConnected, viewerCount }: LiveIndicatorProps) {
  return (
    <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          {isConnected && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          )}
          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
        </span>
        <span className="text-xs font-medium text-white/80 uppercase tracking-wide">
          {isConnected ? 'Live' : 'Offline'}
        </span>
      </div>
      
      {isConnected && (
        <>
          <div className="w-px h-3 bg-white/20"></div>
          <div className="flex items-center gap-1.5 text-xs text-white/60">
            <span>👥</span>
            <span>{viewerCount} online</span>
          </div>
        </>
      )}
    </div>
  );
}
