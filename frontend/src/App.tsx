import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Home } from '@/pages/Home'
import { Poll } from '@/pages/Poll'
import { NotFound } from '@/pages/NotFound'

import { Footer } from '@/components/Footer'

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/poll/:shareCode" element={<Poll />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  )
}

function App() {
  return (
    <TooltipProvider>
      <Router>
        <div className="flex flex-col min-h-screen">
          <AnimatedRoutes />
          <Footer />
        </div>
      </Router>
    </TooltipProvider>
  )
}

export default App
