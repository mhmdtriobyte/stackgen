import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center">
      <h2 className="text-2xl font-bold mb-2">404 - Page Not Found</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        The page you are looking for does not exist.
      </p>
      <Link
        to="/"
        className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors"
      >
        Return Home
      </Link>
    </div>
  );
}
