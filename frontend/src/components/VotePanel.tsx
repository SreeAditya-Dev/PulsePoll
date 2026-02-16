import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Vote } from 'lucide-react'
import type { PollOption } from '@/lib/types'
import { api } from '@/lib/api'
import { getDeviceFingerprint, markPollAsVoted } from '@/lib/fingerprint'
import { staggerContainer, staggerItem } from '@/lib/motion'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface VotePanelProps {
  shareCode: string
  pollId: string
  options: PollOption[]
  onVoteSuccess: () => void
  isExpired?: boolean
}

export function VotePanel({ shareCode, pollId, options, onVoteSuccess, isExpired }: VotePanelProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [isVoting, setIsVoting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleVote = async () => {
    if (!selectedOption || isVoting) return

    setIsVoting(true)
    setError(null)

    try {
      const fingerprint = getDeviceFingerprint()
      const response = await api.vote(shareCode, selectedOption, fingerprint)

      if (response.success) {
        markPollAsVoted(pollId)
        onVoteSuccess()
      }
    } catch (err: any) {
      if (err.status === 409) {
        markPollAsVoted(pollId)
        onVoteSuccess()
      } else {
        console.error('Vote failed:', err)
        setError(err.message || 'Failed to submit vote')
      }
    } finally {
      setIsVoting(false)
    }
  }

  if (isExpired) {
    return (
      <div className="text-center p-8 rounded-xl border border-border/50 bg-muted/20">
        <p className="text-muted-foreground">This poll has ended.</p>
      </div>
    )
  }

  return (
    <motion.div
      className="space-y-5 w-full max-w-xl mx-auto"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <div className="grid gap-2.5">
        <AnimatePresence>
          {options.map((opt) => (
            <motion.button
              key={opt.id}
              variants={staggerItem}
              layout
              onClick={() => setSelectedOption(opt.id)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className={cn(
                'group relative overflow-hidden p-4 rounded-xl border text-left transition-all duration-200',
                selectedOption === opt.id
                  ? 'bg-primary/8 border-primary/40 shadow-lg shadow-primary/10 glow-primary'
                  : 'bg-card/50 border-border/30 hover:bg-card/80 hover:border-border/60'
              )}
            >
              <div className="flex items-center gap-4 relative z-10">
                <div
                  className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 shrink-0',
                    selectedOption === opt.id
                      ? 'border-primary bg-primary scale-110'
                      : 'border-muted-foreground/30 group-hover:border-muted-foreground/50'
                  )}
                >
                  <AnimatePresence>
                    {selectedOption === opt.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="w-2 h-2 rounded-full bg-white"
                      />
                    )}
                  </AnimatePresence>
                </div>
                <span
                  className={cn(
                    'text-base font-medium transition-colors',
                    selectedOption === opt.id ? 'text-foreground' : 'text-foreground/70'
                  )}
                >
                  {opt.label}
                </span>
              </div>

              {/* Selection glow background */}
              {selectedOption === opt.id && (
                <motion.div
                  layoutId="vote-selection"
                  className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent rounded-xl"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-xl text-sm text-center font-medium"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Vote Button */}
      <Button
        onClick={handleVote}
        disabled={!selectedOption || isVoting}
        variant="gradient"
        size="xl"
        className="w-full"
      >
        {isVoting ? (
          <span className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Casting Vote…
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Vote className="w-5 h-5" />
            Vote Now
          </span>
        )}
      </Button>
    </motion.div>
  )
}
