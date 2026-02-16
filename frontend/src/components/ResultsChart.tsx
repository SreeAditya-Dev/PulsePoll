import { useState, useEffect } from 'react';
import type { PollOption } from '../lib/types';
import clsx from 'clsx';

interface ResultsChartProps {
  options: PollOption[];
  tallies: Record<string, number>;
  totalVotes: number;
}

export function ResultsChart({ options, tallies, totalVotes }: ResultsChartProps) {
  // Sort options by vote count descending for a better visual
  const [sortedOptions, setSortedOptions] = useState(options);

  useEffect(() => {
    // Keep original order or sort? Let's keep original order to match the question flow
    // but maybe we can add a toggle later.
    // For now, let's stick to the defined position order.
    setSortedOptions([...options].sort((a, b) => a.position - b.position));
  }, [options]);



  return (
    <div className="space-y-4 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      {sortedOptions.map((opt) => {
        const count = tallies[opt.id] || 0;
        const percentage = totalVotes > 0 ? ((count / totalVotes) * 100).toFixed(1) : '0.0';
        const isLeader = count > 0 && count === Math.max(...Object.values(tallies));

        return (
          <div key={opt.id} className="relative group">
            <div className="flex justify-between items-end mb-1 px-1">
              <span className={clsx("font-medium transition-colors", isLeader ? "text-white" : "text-white/70")}>
                {opt.label}
              </span>
              <div className="text-right">
                <span className={clsx("text-sm font-bold", isLeader ? "text-primary" : "text-white/60")}>
                  {percentage}%
                </span>
                <span className="text-xs text-white/30 ml-2">({count})</span>
              </div>
            </div>

            {/* Bar container */}
            <div className="h-3 bg-white/5 rounded-full overflow-hidden relative backdrop-blur-sm border border-white/5">
              {/* Animated Bar */}
              <div
                className={clsx(
                  "h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden",
                  isLeader 
                    ? "bg-gradient-to-r from-primary to-secondary shadow-[0_0_15px_rgba(108,99,255,0.4)]" 
                    : "bg-white/20"
                )}
                style={{ width: `${percentage}%` }}
              >
                {/* Shimmer effect for leader */}
                {isLeader && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full -translate-x-full animate-[shimmer_2s_infinite]" />
                )}
              </div>
            </div>
          </div>
        );
      })}

      <div className="pt-4 text-center text-white/30 text-xs uppercase tracking-widest font-medium">
        Total Votes: {totalVotes}
      </div>
    </div>
  );
}
