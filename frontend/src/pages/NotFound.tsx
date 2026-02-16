import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
      <h1 className="text-9xl font-bold text-white/10 select-none">404</h1>
      <div className="glass-card p-8 -mt-12 relative z-10 max-w-md w-full">
        <h2 className="text-2xl font-bold text-white mb-4">Page Not Found</h2>
        <p className="text-white/60 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/" className="btn-primary w-full block text-center">
          Go Back Home
        </Link>
      </div>
    </div>
  );
}
