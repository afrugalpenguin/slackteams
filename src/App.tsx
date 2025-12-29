import { useState, useEffect, lazy, Suspense } from 'react';
import { initializeMsal, login, getCurrentAccount } from './services/auth';
import { getCurrentUser } from './services/graph';
import { ToastContainer } from './components';
import { useAppStore } from './stores/appStore';
import { toast } from './stores/toastStore';
import { logger } from './utils';

// Lazy load main app components (only needed after auth)
const Sidebar = lazy(() => import('./components/Sidebar/Sidebar').then(m => ({ default: m.Sidebar })));
const MainContent = lazy(() => import('./components/MainContent/MainContent').then(m => ({ default: m.MainContent })));

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { setCurrentUser, darkMode } = useAppStore();

  // Apply dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Initialize auth on mount
  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        logger.debug('Initializing MSAL...');
        await initializeMsal();
        logger.debug('MSAL initialized');

        const account = await getCurrentAccount();
        logger.debug('Current account:', account);

        if (account && mounted) {
          const user = await getCurrentUser();
          setCurrentUser(user);
          setIsAuthenticated(true);
        }
      } catch (err) {
        logger.error('Init error:', err);
        if (mounted) {
          setError(String(err));
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, [setCurrentUser]);

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const account = await login();
      if (account) {
        const user = await getCurrentUser();
        setCurrentUser(user);
        setIsAuthenticated(true);
      }
    } catch (err) {
      logger.error('Login error:', err);
      setError('Failed to sign in. Please try again.');
      toast.error('Failed to sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-slack-purple to-slack-aubergine">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin h-12 w-12 border-4 border-white border-t-transparent rounded-full" />
          <h1 className="text-2xl font-bold text-white">SlackTeams</h1>
          <p className="text-white/70">Loading...</p>
          {error && <p className="text-red-300 text-sm">{error}</p>}
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-slack-purple to-slack-aubergine">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">SlackTeams</h1>
            <p className="text-gray-600">A lightweight Microsoft Teams client</p>
          </div>

          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            Sign in with Microsoft
          </button>

          {error && (
            <p className="text-red-500 text-sm text-center mt-4">{error}</p>
          )}
        </div>
      </div>
    );
  }

  // Main app
  return (
    <div className="h-full w-full flex">
      <Suspense fallback={
        <div className="h-full w-full flex items-center justify-center bg-main">
          <div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full" />
        </div>
      }>
        <Sidebar />
        <MainContent />
      </Suspense>
      <ToastContainer />
    </div>
  );
}

export default App;
