import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Home } from '@/pages/Home'
import { Poll } from '@/pages/Poll'
import { NotFound } from '@/pages/NotFound'

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
        <AnimatedRoutes />
      </Router>
    </TooltipProvider>
  )
}

export default App
