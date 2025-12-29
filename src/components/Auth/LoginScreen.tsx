import { useState } from 'react';
import { useAuth } from '../../hooks';
import { logger } from '../../utils';

export function LoginScreen() {
  const { login, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    try {
      await login();
    } catch (err) {
      setError('Failed to sign in. Please try again.');
      logger.error('Login failed:', err);
    }
  };

  return (
    <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-slack-purple to-slack-aubergine">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">SlackTeams</h1>
          <p className="text-gray-600">
            A lightweight Microsoft Teams client
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full bg-slack-blue hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Signing in...
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 23 23"
                  fill="currentColor"
                >
                  <path d="M0 0h11v11H0z" />
                  <path d="M12 0h11v11H12z" />
                  <path d="M0 12h11v11H0z" />
                  <path d="M12 12h11v11H12z" />
                </svg>
                Sign in with Microsoft
              </>
            )}
          </button>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Required Permissions:
          </h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Read your profile
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Access your Teams and channels
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Read and send messages
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              View presence status
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
