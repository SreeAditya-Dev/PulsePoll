import { useState } from 'react';
import { api } from '../lib/api';
import { ShareModal } from './ShareModal';
import { getDeviceFingerprint } from '../lib/fingerprint';
import clsx from 'clsx';


export function CreatePollForm() {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Share modal state
  const [createdShareCode, setCreatedShareCode] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setError(null);
    setIsSubmitting(true);
    
    // basic validation
    const cleanOptions = options.filter(o => o.trim().length > 0);
    if (!question.trim()) {
      setError('Please enter a question');
      setIsSubmitting(false);
      return;
    }
    if (cleanOptions.length < 2) {
      setError('At least 2 valid options are required');
      setIsSubmitting(false);
      return;
    }

    try {
      const fingerprint = getDeviceFingerprint();
      const result = await api.createPoll({
        question,
        options: cleanOptions,
        fingerprint
      });

      setCreatedShareCode(result.shareCode);
      setIsModalOpen(true);
      
    } catch (err: any) {
      console.error('Creation failed:', err);
      setError(err.message || 'Failed to create poll');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setQuestion('');
    setOptions(['', '', '']);
    setCreatedShareCode(null);
    setIsModalOpen(false);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto space-y-8">
        <div className="glass-card space-y-6">
          <div className="space-y-2">
            <label className="text-white/60 text-sm font-medium uppercase tracking-wider ml-1">
              Your Question
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What would you like to ask?"
              className="input-glass text-xl min-h-[120px] resize-none"
              maxLength={500}
              autoFocus
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center ml-1">
              <label className="text-white/60 text-sm font-medium uppercase tracking-wider">
                Options ({options.filter(o => o.trim()).length})
              </label>
              <span className="text-xs text-white/40">Min 2 • Max 10</span>
            </div>
            
            <div className="space-y-3">
              {options.map((opt, idx) => (
                <div key={idx} className="flex gap-2 group animate-in fade-in slide-in-from-left-4 duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                  <div className="relative flex-1">
                    <input
                      value={opt}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      placeholder={`Option ${idx + 1}`}
                      className="input-glass pr-10"
                      maxLength={200}
                    />
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(idx)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-red-400 transition-colors"
                        tabIndex={-1}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {options.length < 10 && (
              <button
                type="button"
                onClick={addOption}
                className="text-primary hover:text-primary/80 text-sm font-medium flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-white/5"
              >
                + Add another option
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-xl text-center text-sm animate-pulse">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className={clsx(
            "w-full btn-primary text-lg font-bold py-4",
            isSubmitting && "opacity-70 cursor-wait"
          )}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Creating Poll...
            </span>
          ) : (
            "Create & Share Poll"
          )}
        </button>
      </form>

      {createdShareCode && (
        <ShareModal
          shareCode={createdShareCode}
          isOpen={isModalOpen}
          onClose={handleReset}
        />
      )}
    </>
  );
}
