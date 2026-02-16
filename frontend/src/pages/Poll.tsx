import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Calendar, BarChart3, Check, Link as LinkIcon } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { api } from '@/lib/api'
import type { PollData } from '@/lib/types'
import { getDeviceFingerprint, hasVotedLocally, markPollAsVoted } from '@/lib/fingerprint'
import { usePollSocket } from '@/hooks/usePollSocket'
import { LiveIndicator } from '@/components/LiveIndicator'
import { VotePanel } from '@/components/VotePanel'
import { ResultsChart } from '@/components/ResultsChart'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { pageTransition } from '@/lib/motion'

export function Poll() {
  const { shareCode } = useParams<{ shareCode: string }>()
  const [pollData, setPollData] = useState<PollData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasVoted, setHasVoted] = useState(false)
  const [copied, setCopied] = useState(false)

  const { isConnected, tallies, totalVotes, viewerCount, isActive } = usePollSocket({ shareCode })

  useEffect(() => {
    if (!shareCode) return

    const fetchPoll = async () => {
      try {
        const fingerprint = await getDeviceFingerprint()
        const data = await api.getPoll(shareCode, fingerprint)
        setPollData(data)

        if (data.hasVoted || hasVotedLocally(data.poll.id)) {
          setHasVoted(true)
          markPollAsVoted(data.poll.id)
        }
      } catch (err: any) {
        console.error('Failed to load poll:', err)
        setError(err.message || 'Failed to load poll')
      } finally {
        setLoading(false)
      }
    }

    fetchPoll()
  }, [shareCode])

  const handleVoteSuccess = () => setHasVoted(true)

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch (err) {
      console.error('Copy failed:', err)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen pt-20 pb-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
        <Navbar />
        <div className="w-full max-w-3xl mx-auto space-y-6 mt-8">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    )
  }

  // Error state
  if (error || !pollData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="max-w-md w-full">
            <CardContent className="p-8 text-center space-y-5">
              <div className="text-6xl mb-2">😕</div>
              <h2 className="text-2xl font-heading font-bold text-foreground">Poll Not Found</h2>
              <p className="text-muted-foreground text-sm">
                {error || "This poll doesn't exist or has expired."}
              </p>
              <Button asChild variant="gradient" className="w-full">
                <Link to="/">Create a New Poll</Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
      <Navbar />

      <motion.main
        className="w-full max-w-3xl mx-auto space-y-6"
        variants={pageTransition}
        initial="initial"
        animate="animate"
      >
        {/* Top bar */}
        <div className="flex justify-between items-center px-1">
          <Link
            to="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back
          </Link>
          <LiveIndicator isConnected={isConnected} viewerCount={viewerCount} />
        </div>

        {/* Poll Header Card */}
        <Card className="relative overflow-hidden">
          {/* Background decorative element */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-full" />

          <CardContent className="p-6 sm:p-8 relative z-10">
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-4 leading-tight tracking-tight">
              {pollData.poll.question}
            </h1>

            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline" className="gap-1.5">
                <Calendar className="w-3 h-3" />
                {new Date(pollData.poll.createdAt).toLocaleDateString()}
              </Badge>
              <Badge variant="outline" className="gap-1.5">
                <BarChart3 className="w-3 h-3" />
                {totalVotes > 0 ? totalVotes : pollData.totalVotes} votes
              </Badge>
              {!isActive && (
                <Badge variant="destructive">Ended</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dynamic Content: Vote or Results */}
        <Card>
          <CardContent className="p-6 sm:p-8">
            <AnimatePresence mode="wait">
              {!hasVoted && isActive ? (
                <motion.div
                  key="vote"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.4 }}
                >
                  <h2 className="text-lg font-heading font-bold text-foreground mb-5">
                    Cast your vote
                  </h2>
                  <VotePanel
                    shareCode={shareCode!}
                    pollId={pollData.poll.id}
                    options={pollData.options}
                    onVoteSuccess={handleVoteSuccess}
                    isExpired={!isActive}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-heading font-bold text-foreground">
                      Live Results
                    </h2>
                    {hasVoted && (
                      <Badge variant="success" className="gap-1">
                        ✓ You've voted
                      </Badge>
                    )}
                  </div>

                  <ResultsChart
                    options={pollData.options}
                    tallies={{ ...pollData.tallies, ...tallies }}
                    totalVotes={totalVotes > 0 ? totalVotes : pollData.totalVotes}
                  />

                  {/* Share link */}
                  <div className="mt-6 pt-5 border-t border-border/30 text-center">
                    <Button
                      onClick={handleCopyLink}
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-foreground gap-2"
                    >
                      <AnimatePresence mode="wait">
                        {copied ? (
                          <motion.span
                            key="copied"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="flex items-center gap-1.5 text-emerald-400"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Link Copied!
                          </motion.span>
                        ) : (
                          <motion.span
                            key="share"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="flex items-center gap-1.5"
                          >
                            <LinkIcon className="w-3.5 h-3.5" />
                            Share this poll
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.main>
    </div>
  )
}
