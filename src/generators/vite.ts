/**
 * Vite + React Generator Module
 *
 * Generates a complete Vite + React frontend project with:
 * - Vite 5 build setup
 * - React 18 with React Router
 * - TypeScript configuration
 * - Tailwind CSS styling
 * - API client for Express backend
 * - Auth context and hooks
 */

import path from 'path';
import fs from 'fs-extra';
import {
  BaseGenerator,
  type ProjectConfig,
  type GenerationResult,
  generateVitePackageJson,
  generateViteTsConfig,
  getTemplateDir,
  writeFile,
  writeJsonFile,
} from './base.js';

// =============================================================================
// VITE SPECIFIC CONTENT GENERATORS
// =============================================================================

/**
 * Generates vite.config.ts content
 */
function generateViteConfig(config: ProjectConfig): string {
  const proxyConfig = config.backend === 'express' ? `
    // Proxy API requests to Express backend during development
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },` : '';

  return `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,${proxyConfig}
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
`;
}

/**
 * Generates tsconfig.node.json content
 */
function generateTsConfigNode(): Record<string, unknown> {
  return {
    compilerOptions: {
      tsBuildInfoFile: './node_modules/.tmp/tsconfig.node.tsbuildinfo',
      target: 'ES2022',
      lib: ['ES2023'],
      module: 'ESNext',
      skipLibCheck: true,
      moduleResolution: 'bundler',
      allowImportingTsExtensions: true,
      isolatedModules: true,
      moduleDetection: 'force',
      noEmit: true,
      strict: true,
      noUnusedLocals: true,
      noUnusedParameters: true,
      noFallthroughCasesInSwitch: true,
      noUncheckedSideEffectImports: true,
    },
    include: ['vite.config.ts'],
  };
}

/**
 * Generates index.html content
 */
function generateIndexHtml(config: ProjectConfig): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${config.name}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;
}

/**
 * Generates src/main.tsx content
 */
function generateMainTsx(): string {
  return `import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
`;
}

/**
 * Generates src/App.tsx content
 */
function generateAppTsx(config: ProjectConfig): string {
  return `import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { DashboardPage } from './pages/DashboardPage';
import { SignInPage } from './pages/SignInPage';
import { SignUpPage } from './pages/SignUpPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="auth/signin" element={<SignInPage />} />
        <Route path="auth/signup" element={<SignUpPage />} />
        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;
`;
}

/**
 * Generates src/index.css content
 */
function generateIndexCss(): string {
  return `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: #ffffff;
  --foreground: #171717;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}

body {
  color: var(--foreground);
  background: var(--background);
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    "Helvetica Neue", Arial, sans-serif;
}
`;
}

/**
 * Generates tailwind.config.js content
 */
function generateTailwindConfig(): string {
  return `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
      },
    },
  },
  plugins: [],
};
`;
}

/**
 * Generates postcss.config.js content
 */
function generatePostCssConfig(): string {
  return `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`;
}

/**
 * Generates src/lib/api.ts content (API client)
 */
function generateApiClient(config: ProjectConfig): string {
  return `import axios, { type AxiosError, type AxiosRequestConfig } from 'axios';

/**
 * API Client Configuration
 *
 * Configured to work with the Express backend.
 * In development, Vite proxies /api requests to the backend.
 * In production, update baseURL to point to your API server.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies for session-based auth
});

// Request interceptor for adding auth tokens if needed
apiClient.interceptors.request.use(
  (config) => {
    // You can add auth tokens here if using token-based auth
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = \`Bearer \${token}\`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      window.location.href = '/auth/signin';
    }
    return Promise.reject(error);
  }
);

/**
 * Type-safe API request wrapper
 */
export async function apiRequest<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.request<T>(config);
  return response.data;
}

/**
 * API endpoints
 */
export const api = {
  auth: {
    signIn: (email: string, password: string) =>
      apiRequest<{ success: boolean }>({
        method: 'POST',
        url: '/auth/signin',
        data: { email, password },
      }),

    signUp: (name: string, email: string, password: string) =>
      apiRequest<{ success: boolean }>({
        method: 'POST',
        url: '/auth/signup',
        data: { name, email, password },
      }),

    signOut: () =>
      apiRequest<{ success: boolean }>({
        method: 'POST',
        url: '/auth/signout',
      }),

    me: () =>
      apiRequest<{ user: User | null }>({
        method: 'GET',
        url: '/auth/me',
      }),
  },

  health: {
    check: () =>
      apiRequest<{ status: string; timestamp: string }>({
        method: 'GET',
        url: '/health',
      }),
  },
};

// Types
export interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
}

export default api;
`;
}

/**
 * Generates src/context/AuthContext.tsx content
 */
function generateAuthContext(): string {
  return `import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { api, type User } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const response = await api.auth.me();
      setUser(response.user);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      await refreshUser();
      setIsLoading(false);
    };

    initAuth();
  }, [refreshUser]);

  const signIn = async (email: string, password: string) => {
    await api.auth.signIn(email, password);
    await refreshUser();
  };

  const signUp = async (name: string, email: string, password: string) => {
    await api.auth.signUp(name, email, password);
    // Don't auto-login after signup, redirect to signin
  };

  const signOut = async () => {
    await api.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        signIn,
        signUp,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
`;
}

/**
 * Generates src/hooks/useAuth.ts content
 */
function generateUseAuthHook(): string {
  return `export { useAuth } from '@/context/AuthContext';
`;
}

/**
 * Generates src/components/Layout.tsx content
 */
function generateLayout(config: ProjectConfig): string {
  return `import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export function Layout() {
  const { user, signOut, isLoading } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-200 dark:border-gray-800">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold">
            ${config.name}
          </Link>

          <div className="flex items-center gap-4">
            {isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            ) : user ? (
              <>
                <Link
                  to="/dashboard"
                  className="text-sm font-medium hover:text-blue-600 transition-colors"
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => signOut()}
                  className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/auth/signin"
                  className="text-sm font-medium hover:text-blue-600 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/auth/signup"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-gray-200 dark:border-gray-800 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-600 dark:text-gray-400">
          &copy; {new Date().getFullYear()} ${config.name}. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
`;
}

/**
 * Generates src/components/ProtectedRoute.tsx content
 */
function generateProtectedRoute(): string {
  return `import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to signin with callback URL
    return <Navigate to={\`/auth/signin?callbackUrl=\${encodeURIComponent(location.pathname)}\`} replace />;
  }

  return <>{children}</>;
}
`;
}

/**
 * Generates src/pages/HomePage.tsx content
 */
function generateHomePage(config: ProjectConfig): string {
  return `import { Link } from 'react-router-dom';

export function HomePage() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center p-8">
      <div className="text-center space-y-8">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          Welcome to ${config.name}
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
`;
}

/**
 * Generates src/pages/DashboardPage.tsx content
 */
function generateDashboardPage(): string {
  return `import { useAuth } from '@/hooks/useAuth';

export function DashboardPage() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-[80vh] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <button
            onClick={() => signOut()}
            className="rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Sign Out
          </button>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            Welcome, {user?.name || user?.email}!
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            You are successfully authenticated. This is a protected page.
          </p>
          <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <h3 className="font-medium mb-2">User Info:</h3>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
`;
}

/**
 * Generates src/pages/SignInPage.tsx content
 */
function generateSignInPage(): string {
  return `import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export function SignInPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      navigate(callbackUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Sign In</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Welcome back! Please sign in to continue.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Don&apos;t have an account?{' '}
          <Link to="/auth/signup" className="text-blue-600 hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
`;
}

/**
 * Generates src/pages/SignUpPage.tsx content
 */
function generateSignUpPage(): string {
  return `import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export function SignUpPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      await signUp(name, email, password);
      navigate('/auth/signin?registered=true');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Create Account</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Sign up to get started.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Your name"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="At least 8 characters"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Confirm your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <Link to="/auth/signin" className="text-blue-600 hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
`;
}

/**
 * Generates src/pages/NotFoundPage.tsx content
 */
function generateNotFoundPage(): string {
  return `import { Link } from 'react-router-dom';

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
`;
}

/**
 * Generates ESLint config for Vite
 */
function generateEslintConfig(): string {
  return `import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  }
);
`;
}

/**
 * Generates public/vite.svg content
 */
function generateViteSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" class="iconify iconify--logos" width="31.88" height="32" preserveAspectRatio="xMidYMid meet" viewBox="0 0 256 257"><defs><linearGradient id="IconifyId1813088fe1fbc01fb466" x1="-.828%" x2="57.636%" y1="7.652%" y2="78.411%"><stop offset="0%" stop-color="#41D1FF"></stop><stop offset="100%" stop-color="#BD34FE"></stop></linearGradient><linearGradient id="IconifyId1813088fe1fbc01fb467" x1="43.376%" x2="50.316%" y1="2.242%" y2="89.03%"><stop offset="0%" stop-color="#FFBD4F"></stop><stop offset="100%" stop-color="#FF980E"></stop></linearGradient></defs><path fill="url(#IconifyId1813088fe1fbc01fb466)" d="M255.153 37.938L134.897 252.976c-2.483 4.44-8.862 4.466-11.382.048L.875 37.958c-2.746-4.814 1.371-10.646 6.827-9.67l120.385 21.517a6.537 6.537 0 0 0 2.322-.004l117.867-21.483c5.438-.991 9.574 4.796 6.877 9.62Z"></path><path fill="url(#IconifyId1813088fe1fbc01fb467)" d="M185.432.063L96.44 17.501a3.268 3.268 0 0 0-2.634 3.014l-5.474 92.456a3.268 3.268 0 0 0 3.997 3.378l24.777-5.718c2.318-.535 4.413 1.507 3.936 3.838l-7.361 36.047c-.495 2.426 1.782 4.5 4.151 3.78l15.304-4.649c2.372-.72 4.652 1.36 4.15 3.788l-11.698 56.621c-.732 3.542 3.979 5.473 5.943 2.437l1.313-2.028l72.516-144.72c1.215-2.423-.88-5.186-3.54-4.672l-25.505 4.922c-2.396.462-4.435-1.77-3.759-4.114l16.646-57.705c.677-2.35-1.37-4.583-3.769-4.113Z"></path></svg>`;
}

/**
 * Generates .env.example content
 */
function generateEnvExample(): string {
  return `# API URL (used in production)
# In development, Vite proxies /api to the backend
VITE_API_URL=
`;
}

// =============================================================================
// VITE GENERATOR CLASS
// =============================================================================

export class ViteGenerator extends BaseGenerator {
  constructor(config: ProjectConfig, destPath: string) {
    super(config, destPath);
  }

  async generate(): Promise<GenerationResult> {
    try {
      // Create project structure
      await this.createDirectoryStructure();

      // Generate configuration files
      await this.generatePackageJson();
      await this.generateTsConfig();
      await this.generateViteConfig();
      await this.generateTailwindConfig();
      await this.generateEslintConfig();

      // Generate app structure
      await this.generateAppStructure();

      // Generate pages
      await this.generatePages();

      // Generate components
      await this.generateComponents();

      // Generate context and hooks
      await this.generateContextAndHooks();

      // Generate lib files
      await this.generateLibFiles();

      // Generate public files
      await this.generatePublicFiles();

      // Generate shared files
      await this.setupSharedFiles();

      // Copy any existing templates
      const templateDir = getTemplateDir('vite');
      await this.copyTemplateFiles(templateDir);

      return this.createResult(true, 'Vite + React project generated successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.errors.push(errorMessage);
      return this.createResult(false, `Failed to generate Vite project: ${errorMessage}`);
    }
  }

  private async createDirectoryStructure(): Promise<void> {
    const directories = [
      'src',
      'src/components',
      'src/context',
      'src/hooks',
      'src/lib',
      'src/pages',
      'public',
    ];

    for (const dir of directories) {
      const dirPath = path.join(this.destPath, dir);
      await fs.ensureDir(dirPath);
    }
  }

  protected async generatePackageJson(): Promise<void> {
    const packageJson = generateVitePackageJson(this.config);
    await this.writeProjectJsonFile('package.json', packageJson);
  }

  protected async generateTsConfig(): Promise<void> {
    const tsConfig = generateViteTsConfig();
    await this.writeProjectJsonFile('tsconfig.json', tsConfig);

    const tsConfigNode = generateTsConfigNode();
    await this.writeProjectJsonFile('tsconfig.node.json', tsConfigNode);
  }

  private async generateViteConfig(): Promise<void> {
    await this.writeProjectFile('vite.config.ts', generateViteConfig(this.config));
  }

  private async generateTailwindConfig(): Promise<void> {
    await this.writeProjectFile('tailwind.config.js', generateTailwindConfig());
    await this.writeProjectFile('postcss.config.js', generatePostCssConfig());
  }

  private async generateEslintConfig(): Promise<void> {
    await this.writeProjectFile('eslint.config.js', generateEslintConfig());
  }

  private async generateAppStructure(): Promise<void> {
    // index.html
    await this.writeProjectFile('index.html', generateIndexHtml(this.config));

    // src/main.tsx
    await this.writeProjectFile('src/main.tsx', generateMainTsx());

    // src/App.tsx
    await this.writeProjectFile('src/App.tsx', generateAppTsx(this.config));

    // src/index.css
    await this.writeProjectFile('src/index.css', generateIndexCss());

    // src/vite-env.d.ts
    await this.writeProjectFile(
      'src/vite-env.d.ts',
      `/// <reference types="vite/client" />
`
    );
  }

  private async generatePages(): Promise<void> {
    await this.writeProjectFile('src/pages/HomePage.tsx', generateHomePage(this.config));
    await this.writeProjectFile('src/pages/DashboardPage.tsx', generateDashboardPage());
    await this.writeProjectFile('src/pages/SignInPage.tsx', generateSignInPage());
    await this.writeProjectFile('src/pages/SignUpPage.tsx', generateSignUpPage());
    await this.writeProjectFile('src/pages/NotFoundPage.tsx', generateNotFoundPage());

    // Index file
    await this.writeProjectFile(
      'src/pages/index.ts',
      `export { HomePage } from './HomePage';
export { DashboardPage } from './DashboardPage';
export { SignInPage } from './SignInPage';
export { SignUpPage } from './SignUpPage';
export { NotFoundPage } from './NotFoundPage';
`
    );
  }

  private async generateComponents(): Promise<void> {
    await this.writeProjectFile('src/components/Layout.tsx', generateLayout(this.config));
    await this.writeProjectFile('src/components/ProtectedRoute.tsx', generateProtectedRoute());

    // Index file
    await this.writeProjectFile(
      'src/components/index.ts',
      `export { Layout } from './Layout';
export { ProtectedRoute } from './ProtectedRoute';
`
    );
  }

  private async generateContextAndHooks(): Promise<void> {
    await this.writeProjectFile('src/context/AuthContext.tsx', generateAuthContext());
    await this.writeProjectFile('src/hooks/useAuth.ts', generateUseAuthHook());
  }

  private async generateLibFiles(): Promise<void> {
    await this.writeProjectFile('src/lib/api.ts', generateApiClient(this.config));
  }

  private async generatePublicFiles(): Promise<void> {
    await this.writeProjectFile('public/vite.svg', generateViteSvg());
  }

  protected override async setupSharedFiles(): Promise<void> {
    // Override to include Vite-specific .env.example
    await super.setupSharedFiles();
    await this.writeProjectFile('.env.example', generateEnvExample());
  }
}

// =============================================================================
// STANDALONE GENERATE FUNCTION
// =============================================================================

/**
 * Standalone function to generate a Vite + React project
 * Can be used without instantiating the class
 */
export async function generate(
  config: ProjectConfig,
  destPath: string
): Promise<GenerationResult> {
  const generator = new ViteGenerator(config, destPath);
  return generator.generate();
}

export default ViteGenerator;
