import { Navbar } from '../components/Navbar';

import { CreatePollForm } from '../components/CreatePollForm';

export function Home() {
  return (
    <div className="min-h-screen pt-20 pb-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
      <Navbar />
      
      <main className="w-full max-w-4xl mx-auto flex-1 flex flex-col items-center justify-center space-y-12 animate-in fade-in duration-700">
        
        <div className="text-center space-y-4 max-w-2xl">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/5 border border-white/10 text-primary text-xs font-semibold tracking-wide uppercase mb-4 animate-bounce">
            Real-Time • Anonymous • Secure
          </div>
          
          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/50 pb-2">
            Instant Polls for <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
              Modern Teams
            </span>
          </h1>
          
          <p className="text-lg text-white/60 max-w-xl mx-auto leading-relaxed">
            Create a poll in seconds. Share the link. Watch results update live as votes come in. No login required.
          </p>
        </div>

        <div className="w-full backdrop-blur-3xl">
          <CreatePollForm />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-4xl text-center mt-12">
          {[
            { icon: '⚡', title: 'Real-Time Updates', desc: 'Watch votes stream in instantly capabilities.' },
            { icon: '🔒', title: 'Smart Protection', desc: 'Anti-abuse fingerprints ensure fair voting.' },
            { icon: '📱', title: 'Device Friendly', desc: 'Works beautifully on mobile, tablet, and desktop.' }
          ].map((feature, idx) => (
            <div key={idx} className="glass-card p-6 flex flex-col items-center gap-3">
              <span className="text-3xl mb-2">{feature.icon}</span>
              <h3 className="font-bold text-white">{feature.title}</h3>
              <p className="text-sm text-white/50">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
