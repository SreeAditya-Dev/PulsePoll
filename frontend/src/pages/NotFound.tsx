import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
      {/* Glitch 404 */}
      <motion.h1
        className="text-[10rem] sm:text-[14rem] font-display font-bold leading-none text-foreground/[0.03] select-none tracking-tighter"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        404
      </motion.h1>

      <motion.div
        className="-mt-20 relative z-10"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <h2 className="text-2xl font-heading font-bold text-foreground">
              Page Not Found
            </h2>
            <p className="text-muted-foreground text-sm">
              The page you're looking for doesn't exist or has been moved.
            </p>
            <Button asChild variant="gradient" className="w-full">
              <Link to="/" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Go Back Home
              </Link>
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
