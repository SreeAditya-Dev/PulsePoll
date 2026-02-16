import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Loader2, Sparkles } from 'lucide-react'
import { api } from '@/lib/api'
import { getDeviceFingerprint } from '@/lib/fingerprint'
import { staggerContainer, staggerItem, fadeInUp } from '@/lib/motion'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { ShareModal } from './ShareModal'

export function CreatePollForm() {
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState<string[]>(['', '', ''])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdShareCode, setCreatedShareCode] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  const addOption = () => {
    if (options.length < 10) setOptions([...options, ''])
  }

  const removeOption = (index: number) => {
    if (options.length > 2) setOptions(options.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    setError(null)
    setIsSubmitting(true)

    const cleanOptions = options.filter((o) => o.trim().length > 0)
    if (!question.trim()) {
      setError('Please enter a question')
      setIsSubmitting(false)
      return
    }
    if (cleanOptions.length < 2) {
      setError('At least 2 valid options are required')
      setIsSubmitting(false)
      return
    }

    try {
      const fingerprint = await getDeviceFingerprint()
      const result = await api.createPoll({ question, options: cleanOptions, fingerprint })
      setCreatedShareCode(result.shareCode)
      setIsModalOpen(true)
    } catch (err: any) {
      console.error('Creation failed:', err)
      setError(err.message || 'Failed to create poll')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    setQuestion('')
    setOptions(['', '', ''])
    setCreatedShareCode(null)
    setIsModalOpen(false)
  }

  const filledOptionsCount = options.filter((o) => o.trim()).length

  return (
    <>
      <motion.form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl mx-auto space-y-6"
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
      >
        <Card className="overflow-hidden hover:border-border/80 hover:shadow-2xl hover:shadow-primary/5">
          <CardContent className="p-6 sm:p-8 space-y-6">
            {/* Question Input */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Your Question
                </label>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {question.length}/500
                </span>
              </div>
              <Textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="What would you like to ask?"
                className="text-lg min-h-[110px] font-medium"
                maxLength={500}
                autoFocus
              />
            </div>

            {/* Options */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Options ({filledOptionsCount})
                </label>
                <span className="text-xs text-muted-foreground">Min 2 · Max 10</span>
              </div>

              <motion.div className="space-y-2.5" variants={staggerContainer} initial="hidden" animate="visible">
                <AnimatePresence mode="popLayout">
                  {options.map((opt, idx) => (
                    <motion.div
                      key={idx}
                      variants={staggerItem}
                      layout
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 16, scale: 0.95 }}
                      transition={{ duration: 0.25 }}
                      className="flex gap-2 items-center group"
                    >
                      <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-muted/50 text-xs font-bold text-muted-foreground shrink-0">
                        {idx + 1}
                      </div>
                      <div className="relative flex-1">
                        <Input
                          value={opt}
                          onChange={(e) => handleOptionChange(idx, e.target.value)}
                          placeholder={`Option ${idx + 1}`}
                          maxLength={200}
                          className="pr-9"
                        />
                        {options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeOption(idx)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-muted-foreground/40 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                            tabIndex={-1}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>

              {options.length < 10 && (
                <motion.button
                  type="button"
                  onClick={addOption}
                  className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors px-2 py-1.5 rounded-lg hover:bg-primary/5"
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add option
                </motion.button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl text-center text-sm font-medium"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit */}
        <Button
          type="submit"
          disabled={isSubmitting}
          variant="gradient"
          size="xl"
          className="w-full"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Creating Poll…
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Create & Share Poll
            </span>
          )}
        </Button>
      </motion.form>

      {createdShareCode && (
        <ShareModal
          shareCode={createdShareCode}
          isOpen={isModalOpen}
          onClose={handleReset}
        />
      )}
    </>
  )
}
