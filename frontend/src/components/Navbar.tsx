import { Link } from 'react-router-dom';

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-lg group-hover:scale-110 transition-transform">
              P
            </div>
            <span className="font-heading font-bold text-xl tracking-tight text-white group-hover:text-primary transition-colors">
              PulsePoll
            </span>
          </Link>
          
          <div className="flex items-center gap-4">
            <a 
              href="https://github.com/aditya-pulsepoll" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-white/60 hover:text-white transition-colors text-sm font-medium"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
