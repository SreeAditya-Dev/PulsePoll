import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Github, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Navbar() {
  const { scrollY } = useScroll()
  const backdropBlur = useTransform(scrollY, [0, 100], [8, 24])
  const borderOpacity = useTransform(scrollY, [0, 100], [0, 0.1])

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50 border-b"
      style={{
        backdropFilter: useTransform(backdropBlur, (v) => `blur(${v}px)`),
        WebkitBackdropFilter: useTransform(backdropBlur, (v) => `blur(${v}px)`),
        borderColor: useTransform(borderOpacity, (v) => `rgba(255,255,255,${v})`),
        backgroundColor: 'rgba(3, 0, 20, 0.6)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2.5 group">
            <motion.div
              className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-primary via-[hsl(280,70%,60%)] to-accent flex items-center justify-center shadow-lg shadow-primary/25"
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <Zap className="w-5 h-5 text-white fill-white" />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity blur-lg" />
            </motion.div>
            <span className="font-display font-bold text-xl tracking-tight text-foreground group-hover:text-gradient-primary transition-all">
              PulsePoll
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <motion.a
              href="https://github.com/SreeAditya-Dev/PulsePoll"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium',
                'text-muted-foreground hover:text-foreground',
                'bg-transparent hover:bg-muted/50',
                'border border-transparent hover:border-border/50',
                'transition-all duration-200'
              )}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
            >
              <Github className="w-4 h-4" />
              <span className="hidden sm:inline">GitHub</span>
            </motion.a>
          </div>
        </div>
      </div>
    </motion.nav>
  )
}
