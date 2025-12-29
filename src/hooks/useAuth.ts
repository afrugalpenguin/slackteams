import { useCallback, useEffect } from 'react';
import { useAppStore } from '../stores/appStore';
import {
  initializeMsal,
  login as msalLogin,
  logout as msalLogout,
  switchAccount as msalSwitchAccount,
  checkStoredAuth,
  getAccessToken,
  clearCachedAccounts,
} from '../services/auth';
import { getCurrentUser, resetGraphClient } from '../services/graph';
import { logger } from '../utils';

export function useAuth() {
  const {
    isAuthenticated,
    isLoading,
    currentUser,
    authError,
    setAuthenticated,
    setLoading,
    setCurrentUser,
    setAuthError,
    reset,
  } = useAppStore();

  const initialize = useCallback(async () => {
    setLoading(true);
    try {
      await initializeMsal();
      const account = await checkStoredAuth();

      if (account) {
        // Verify we can actually get a token before setting authenticated
        const token = await getAccessToken();
        if (!token) {
          logger.warn('Cached account found but token unavailable, clearing cache');
          await clearCachedAccounts();
          return;
        }
        const user = await getCurrentUser();
        setCurrentUser(user);
        setAuthenticated(true);
      }
    } catch (error) {
      logger.error('Auth initialization error:', error);
    } finally {
      setLoading(false);
    }
  }, [setLoading, setCurrentUser, setAuthenticated]);

  const login = useCallback(async () => {
    setLoading(true);
    setAuthError(null);
    try {
      const account = await msalLogin();
      if (account) {
        const user = await getCurrentUser();
        setCurrentUser(user);
        setAuthenticated(true);
      }
    } catch (error) {
      logger.error('Login error:', error);
      setAuthError('Failed to sign in. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setCurrentUser, setAuthenticated, setAuthError]);

  const logout = useCallback(async () => {
    try {
      await msalLogout();
      resetGraphClient();
      reset();
    } catch (error) {
      logger.error('Logout error:', error);
    }
  }, [reset]);

  const switchAccount = useCallback(async () => {
    setLoading(true);
    try {
      resetGraphClient();
      reset();
      const account = await msalSwitchAccount();
      if (account) {
        const user = await getCurrentUser();
        setCurrentUser(user);
        setAuthenticated(true);
      }
    } catch (error) {
      logger.error('Switch account error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setCurrentUser, setAuthenticated, reset]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return {
    isAuthenticated,
    isLoading,
    currentUser,
    authError,
    login,
    logout,
    switchAccount,
  };
}
