import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Crown, TrendingUp } from 'lucide-react'
import type { PollOption } from '@/lib/types'
import { staggerContainer, staggerItem } from '@/lib/motion'
import { cn } from '@/lib/utils'

interface ResultsChartProps {
  options: PollOption[]
  tallies: Record<string, number>
  totalVotes: number
}

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(value)

  useEffect(() => {
    const diff = value - display
    if (diff === 0) return

    const steps = 15
    const increment = diff / steps
    let current = display
    let step = 0

    const timer = setInterval(() => {
      step++
      current += increment
      if (step >= steps) {
        setDisplay(value)
        clearInterval(timer)
      } else {
        setDisplay(Math.round(current))
      }
    }, 30)

    return () => clearInterval(timer)
  }, [value])

  return <span className="tabular-nums">{display}</span>
}

export function ResultsChart({ options, tallies, totalVotes }: ResultsChartProps) {
  const sortedOptions = [...options].sort((a, b) => a.position - b.position)
  const maxVotes = Math.max(...Object.values(tallies), 0)
  const [hasAnimated, setHasAnimated] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setHasAnimated(true), 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <motion.div
      className="space-y-4 w-full"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {sortedOptions.map((opt, idx) => {
        const count = tallies[opt.id] || 0
        const percentage = totalVotes > 0 ? (count / totalVotes) * 100 : 0
        const percentageStr = percentage.toFixed(1)
        const isLeader = count > 0 && count === maxVotes

        return (
          <motion.div
            key={opt.id}
            variants={staggerItem}
            className="relative group"
          >
            {/* Label row */}
            <div className="flex justify-between items-center mb-1.5 px-0.5">
              <div className="flex items-center gap-2">
                {isLeader && (
                  <motion.span
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  >
                    <Crown className="w-4 h-4 text-amber-400 fill-amber-400/20" />
                  </motion.span>
                )}
                <span
                  className={cn(
                    'font-medium text-sm transition-colors',
                    isLeader ? 'text-foreground' : 'text-foreground/60'
                  )}
                >
                  {opt.label}
                </span>
              </div>

              <div className="flex items-center gap-2 text-right">
                <span
                  className={cn(
                    'text-sm font-bold tabular-nums',
                    isLeader ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  {percentageStr}%
                </span>
                <span className="text-xs text-muted-foreground/50 tabular-nums">
                  (<AnimatedNumber value={count} />)
                </span>
              </div>
            </div>

            {/* Bar container */}
            <div className="h-3 bg-muted/30 rounded-full overflow-hidden relative border border-border/20">
              {/* Animated Bar */}
              <motion.div
                className={cn(
                  'h-full rounded-full relative overflow-hidden',
                  isLeader
                    ? 'bg-gradient-to-r from-primary via-[hsl(280,70%,60%)] to-secondary'
                    : 'bg-gradient-to-r from-muted-foreground/30 to-muted-foreground/20'
                )}
                initial={{ width: '0%' }}
                animate={{ width: hasAnimated ? `${percentage}%` : '0%' }}
                transition={{
                  type: 'spring',
                  stiffness: 80,
                  damping: 18,
                  delay: idx * 0.1,
                }}
              >
                {/* Shimmer on leader */}
                {isLeader && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent bg-[length:200%_100%] animate-shimmer" />
                )}
              </motion.div>
            </div>
          </motion.div>
        )
      })}

      {/* Total */}
      <motion.div
        className="pt-4 flex items-center justify-center gap-2 text-muted-foreground/40 text-xs uppercase tracking-widest font-medium"
        variants={staggerItem}
      >
        <TrendingUp className="w-3.5 h-3.5" />
        <span>
          <AnimatedNumber value={totalVotes} /> total votes
        </span>
      </motion.div>
    </motion.div>
  )
}
