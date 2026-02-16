import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface ShareModalProps {
  shareCode: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareModal({ shareCode, isOpen, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();
  
  if (!isOpen) return null;
  
  const shareUrl = `${window.location.origin}/poll/${shareCode}`;
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleGoToPoll = () => {
    onClose();
    navigate(`/poll/${shareCode}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-[#12121a] rounded-2xl border border-white/10 shadow-2xl p-8 transform transition-all animate-float">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
            🚀
          </div>
          <h2 className="text-2xl font-bold mb-2 text-white">Poll Created!</h2>
          <p className="text-white/60">Share this link to start collecting votes.</p>
        </div>

        <div className="relative mb-6 group">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-xl blur-lg transition-opacity group-hover:opacity-100 opacity-50" />
          <div className="relative flex items-center bg-white/5 border border-white/10 rounded-xl p-2 pr-2">
            <input
              readOnly
              value={shareUrl}
              className="bg-transparent border-none text-white/90 text-sm flex-1 px-3 outline-none w-full"
            />
            <button
              onClick={handleCopy}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                copied 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-primary text-white hover:bg-primary/90'
              }`}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleGoToPoll}
            className="flex-1 btn-primary text-center justify-center flex items-center"
          >
            Go to Poll
          </button>
          <button
            onClick={onClose}
            className="flex-1 btn-ghost"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
