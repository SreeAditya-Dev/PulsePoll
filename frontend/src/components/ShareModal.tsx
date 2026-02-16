import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Copy, Check, ExternalLink, Rocket } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface ShareModalProps {
  shareCode: string
  isOpen: boolean
  onClose: () => void
}

export function ShareModal({ shareCode, isOpen, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false)
  const navigate = useNavigate()

  const shareUrl = `${window.location.origin}/poll/${shareCode}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleGoToPoll = () => {
    onClose()
    navigate(`/poll/${shareCode}`)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col items-center text-center">
          {/* Celebration Icon */}
          <motion.div
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20 flex items-center justify-center mb-5"
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
          >
            <Rocket className="w-8 h-8 text-primary" />
          </motion.div>

          <DialogTitle className="text-2xl mb-2">Poll Created!</DialogTitle>
          <DialogDescription>
            Share this link to start collecting votes.
          </DialogDescription>
        </div>

        {/* Share URL */}
        <motion.div
          className="relative mt-2 group"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/15 to-secondary/15 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative flex items-center bg-muted/50 border border-border/50 rounded-xl p-1.5 gap-1">
            <input
              readOnly
              value={shareUrl}
              className="bg-transparent border-none text-sm text-foreground/80 flex-1 px-3 outline-none w-full font-mono"
            />
            <Button
              onClick={handleCopy}
              variant={copied ? 'default' : 'ghost'}
              size="sm"
              className={copied ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/20' : ''}
            >
              <AnimatePresence mode="wait">
                {copied ? (
                  <motion.span
                    key="check"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Copied!
                  </motion.span>
                ) : (
                  <motion.span
                    key="copy"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copy
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          className="flex gap-3 mt-2"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            onClick={handleGoToPoll}
            variant="gradient"
            className="flex-1"
          >
            <ExternalLink className="w-4 h-4" />
            Go to Poll
          </Button>
          <Button onClick={onClose} variant="outline" className="flex-1">
            Close
          </Button>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}
