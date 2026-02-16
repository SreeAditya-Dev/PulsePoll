import { motion } from 'framer-motion'
import { Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface LiveIndicatorProps {
  isConnected: boolean
  viewerCount: number
}

export function LiveIndicator({ isConnected, viewerCount }: LiveIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      <Badge variant={isConnected ? 'live' : 'destructive'} className="gap-1.5 px-3 py-1">
        <span className="relative flex h-2 w-2">
          {isConnected && (
            <motion.span
              className="absolute inline-flex h-full w-full rounded-full bg-emerald-400"
              animate={{ scale: [1, 1.5, 1], opacity: [0.7, 0, 0.7] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
          <span
            className={cn(
              'relative inline-flex rounded-full h-2 w-2',
              isConnected ? 'bg-emerald-500' : 'bg-destructive'
            )}
          />
        </span>
        <span className="text-xs font-semibold uppercase tracking-wide">
          {isConnected ? 'Live' : 'Offline'}
        </span>
      </Badge>

      {isConnected && viewerCount > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Badge variant="outline" className="gap-1.5 px-2.5 py-1">
            <Users className="w-3 h-3" />
            <motion.span
              key={viewerCount}
              initial={{ y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-xs tabular-nums"
            >
              {viewerCount}
            </motion.span>
          </Badge>
        </motion.div>
      )}
    </div>
  )
}
