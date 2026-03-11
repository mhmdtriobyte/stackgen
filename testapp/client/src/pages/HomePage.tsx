import { Link } from 'react-router-dom';

export function HomePage() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center p-8">
      <div className="text-center space-y-8">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          Welcome to testapp
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl">
          Your Vite + React project is ready! Built with React Router,
          Tailwind CSS, and configured to work with an Express backend.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            to="/dashboard"
            className="rounded-lg bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </Link>
          <a
            href="/api/health"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-gray-300 dark:border-gray-700 px-6 py-3 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Check API Health
          </a>
        </div>
      </div>
    </div>
  );
}
