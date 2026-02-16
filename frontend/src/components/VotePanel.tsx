import { useState } from 'react';
import type { PollOption } from '../lib/types';
import { api } from '../lib/api';
import { getDeviceFingerprint, markPollAsVoted } from '../lib/fingerprint';
import clsx from 'clsx'; // Make sure clsx is installed

interface VotePanelProps {
  shareCode: string;
  pollId: string;
  options: PollOption[];
  onVoteSuccess: () => void;
  isExpired?: boolean;
}

export function VotePanel({ shareCode, pollId, options, onVoteSuccess, isExpired }: VotePanelProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVote = async () => {
    if (!selectedOption || isVoting) return;

    setIsVoting(true);
    setError(null);

    try {
      const fingerprint = getDeviceFingerprint();
      const response = await api.vote(shareCode, selectedOption, fingerprint);
      
      if (response.success) {
        markPollAsVoted(pollId);
        onVoteSuccess();
      }
    } catch (err: any) {
      if (err.status === 409) {
        // Already voted - treat as success for UX but show message?
        // Actually, let's just transition to results
        markPollAsVoted(pollId);
        onVoteSuccess();
      } else {
        console.error('Vote failed:', err);
        setError(err.message || 'Failed to submit vote');
      }
    } finally {
      setIsVoting(false);
    }
  };

  if (isExpired) {
    return (
      <div className="text-center p-8 glass-panel rounded-xl">
        <p className="text-white/60">This poll has ended.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-xl mx-auto animate-in fade-in zoom-in-95 duration-500">
      <div className="grid gap-3">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => setSelectedOption(opt.id)}
            className={clsx(
              "group relative overflow-hidden p-4 rounded-xl border text-left transition-all duration-200",
              selectedOption === opt.id
                ? "bg-primary/10 border-primary shadow-[0_0_20px_rgba(108,99,255,0.2)]"
                : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
            )}
          >
            <div className="flex items-center gap-4">
              <div className={clsx(
                "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                selectedOption === opt.id
                  ? "border-primary bg-primary"
                  : "border-white/30 group-hover:border-white/50"
              )}>
                {selectedOption === opt.id && (
                  <div className="w-2.5 h-2.5 rounded-full bg-white" />
                )}
              </div>
              <span className={clsx(
                "text-lg font-medium transition-colors",
                selectedOption === opt.id ? "text-white" : "text-white/80"
              )}>
                {opt.label}
              </span>
            </div>
            
            {/* Click ripple effect can be added here if needed */}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-3 rounded-lg text-sm text-center">
          {error}
        </div>
      )}

      <button
        onClick={handleVote}
        disabled={!selectedOption || isVoting}
        className={clsx(
          "w-full btn-primary text-lg font-bold py-4 shadow-lg shadow-primary/20",
          (!selectedOption || isVoting) && "opacity-50 cursor-not-allowed shadow-none"
        )}
      >
        {isVoting ? 'Casting Vote...' : 'Vote Now'}
      </button>
    </div>
  );
}
