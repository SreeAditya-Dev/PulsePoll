import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { api } from '../lib/api';
import type { PollData } from '../lib/types';
import { getDeviceFingerprint, hasVotedLocally, markPollAsVoted } from '../lib/fingerprint';
import { usePollSocket } from '../hooks/usePollSocket';
import { LiveIndicator } from '../components/LiveIndicator';
import { VotePanel } from '../components/VotePanel';
import { ResultsChart } from '../components/ResultsChart';

export function Poll() {
  const { shareCode } = useParams<{ shareCode: string }>();
  const [pollData, setPollData] = useState<PollData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);

  // Initialize Socket.IO hook
  const { 
    isConnected, 
    tallies, 
    totalVotes, 
    viewerCount,
    isActive 
  } = usePollSocket({ shareCode });

  useEffect(() => {
    if (!shareCode) return;

    const fetchPoll = async () => {
      try {
        const fingerprint = getDeviceFingerprint();
        const data = await api.getPoll(shareCode, fingerprint);
        setPollData(data);
        
        // Check if user has voted (either from API or local storage)
        if (data.hasVoted || hasVotedLocally(data.poll.id)) {
          setHasVoted(true);
          // Ensure local storage is in sync
          markPollAsVoted(data.poll.id);
        }
      } catch (err: any) {
        console.error('Failed to load poll:', err);
        setError(err.message || 'Failed to load poll');
      } finally {
        setLoading(false);
      }
    };

    fetchPoll();
  }, [shareCode]);

  // Handle successful vote from VotePanel
  const handleVoteSuccess = () => {
    setHasVoted(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary border-r-2 border-r-transparent"></div>
      </div>
    );
  }

  if (error || !pollData) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center p-4">
        <div className="glass-card max-w-md w-full p-8 text-center space-y-6">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-white">Poll Not Found</h2>
          <p className="text-white/60">{error || "This poll doesn't exist or has expired."}</p>
          <Link to="/" className="btn-primary inline-block">
            Create a New Poll
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
      <Navbar />
      
      <main className="w-full max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
        
        {/* Connection Status Bar */}
        <div className="flex justify-between items-center px-2">
          <Link to="/" className="text-sm text-white/40 hover:text-white transition-colors flex items-center gap-2">
            ← Back to Home
          </Link>
          <LiveIndicator isConnected={isConnected} viewerCount={viewerCount} />
        </div>

        {/* Poll Header */}
        <div className="glass-card p-8 border-t border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 animate-float">
            <span className="text-9xl font-bold text-white">?</span>
          </div>
          
          <div className="relative z-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight">
              {pollData.poll.question}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-white/40">
              <span className="flex items-center gap-1.5">
                📅 {new Date(pollData.poll.createdAt).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1.5">
                🗳️ {totalVotes > 0 ? totalVotes : pollData.totalVotes} votes total
              </span>
              {!isActive && (
                 <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 text-xs font-bold uppercase tracking-wide border border-red-500/20">
                   Ended
                 </span>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Content Area: Voting or Results */}
        <div className="glass-panel p-8 rounded-2xl transition-all duration-500">
          {!hasVoted && isActive ? (
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
              <h2 className="text-xl font-semibold text-white mb-6">Cast your vote</h2>
              <VotePanel 
                shareCode={shareCode!} 
                pollId={pollData.poll.id}
                options={pollData.options}
                onVoteSuccess={handleVoteSuccess}
                isExpired={!isActive}
              />
            </div>
          ) : (
            <div className="animate-in fade-in zoom-in-95 duration-500">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center justify-between">
                <span>Live Results</span>
                {hasVoted && (
                  <span className="text-xs font-normal text-primary bg-primary/10 px-2 py-1 rounded border border-primary/20">
                    You've voted
                  </span>
                )}
              </h2>
              <ResultsChart 
                options={pollData.options}
                // Merge initial tallies with live updates
                tallies={{ ...pollData.tallies, ...tallies }} 
                // Use live total if available, otherwise initial
                totalVotes={totalVotes > 0 ? totalVotes : pollData.totalVotes}
              />
              
              <div className="mt-8 pt-6 border-t border-white/5 text-center relative">
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    const btn = document.getElementById('copy-btn');
                    if (btn) {
                        const originalText = btn.innerHTML;
                        btn.innerHTML = '<span>✨</span> Link Copied!';
                        btn.classList.add('text-green-400');
                        setTimeout(() => {
                            btn.innerHTML = originalText;
                            btn.classList.remove('text-green-400');
                        }, 2000);
                    }
                  }}
                  id="copy-btn"
                  className="text-sm text-primary hover:text-primary-light transition-all duration-200 flex items-center justify-center gap-2 mx-auto active:scale-95"
                >
                  <span>🔗</span> Share this poll
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
