import { Heart } from 'lucide-react'

export function Footer() {
  return (
    <footer className="w-full py-6 mt-auto border-t border-white/5 bg-black/20 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5 font-medium">
          <span>Made by</span>
          <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
          <span className="text-foreground font-semibold">Sree Aditya</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wider uppercase border border-primary/20">
            Best
          </span>
        </div>
      </div>
    </footer>
  )
}
