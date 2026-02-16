import { motion } from 'framer-motion'
import { Zap, Shield, Smartphone } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { CreatePollForm } from '@/components/CreatePollForm'
import { staggerContainer, staggerItem } from '@/lib/motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const features = [
  {
    icon: Zap,
    title: 'Real-Time Updates',
    desc: 'Watch votes stream in instantly as they happen.',
    gradient: 'from-primary/20 to-secondary/20',
    iconColor: 'text-primary',
  },
  {
    icon: Shield,
    title: 'Smart Protection',
    desc: 'Anti-abuse fingerprints ensure fair, one-vote-per-person polling.',
    gradient: 'from-secondary/20 to-accent/20',
    iconColor: 'text-secondary',
  },
  {
    icon: Smartphone,
    title: 'Device Friendly',
    desc: 'Works beautifully on mobile, tablet, and desktop.',
    gradient: 'from-accent/20 to-primary/20',
    iconColor: 'text-accent',
  },
]

export function Home() {
  return (
    <div className="min-h-screen pt-20 pb-16 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
      <Navbar />

      <motion.main
        className="w-full max-w-4xl mx-auto flex-1 flex flex-col items-center justify-center space-y-14"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {/* Hero Section */}
        <motion.div className="text-center space-y-5 max-w-2xl" variants={staggerItem}>
          <motion.div variants={staggerItem}>
            <Badge variant="outline" className="px-4 py-1.5 text-xs uppercase tracking-widest">
              Real-Time · Anonymous · Secure
            </Badge>
          </motion.div>

          <motion.h1
            className="text-5xl sm:text-7xl font-display font-bold tracking-tighter leading-[0.9] pb-2"
            variants={staggerItem}
          >
            <span className="text-foreground">Instant Polls for</span>
            <br />
            <span className="text-gradient-primary">Modern Teams</span>
          </motion.h1>

          <motion.p
            className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed"
            variants={staggerItem}
          >
            Create a poll in seconds. Share the link. Watch results update live
            as votes come in. No login required.
          </motion.p>
        </motion.div>

        {/* Poll Creation Form */}
        <motion.div className="w-full" variants={staggerItem}>
          <CreatePollForm />
        </motion.div>

        {/* Feature Cards */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-4xl mt-8"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          {features.map((feature, idx) => (
            <motion.div key={idx} variants={staggerItem}>
              <Card className="group hover:border-border hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-default h-full">
                <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feature.gradient} border border-white/5 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <feature.icon className={`w-5 h-5 ${feature.iconColor}`} />
                  </div>
                  <h3 className="font-heading font-bold text-foreground text-sm">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {feature.desc}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </motion.main>
    </div>
  )
}
