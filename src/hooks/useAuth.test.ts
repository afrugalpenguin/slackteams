import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// Mock the dependencies
const { mockInitializeMsal, mockLogin, mockLogout, mockSwitchAccount, mockCheckStoredAuth, mockGetAccessToken, mockClearCachedAccounts } = vi.hoisted(() => ({
  mockInitializeMsal: vi.fn(),
  mockLogin: vi.fn(),
  mockLogout: vi.fn(),
  mockSwitchAccount: vi.fn(),
  mockCheckStoredAuth: vi.fn(),
  mockGetAccessToken: vi.fn(),
  mockClearCachedAccounts: vi.fn(),
}));

const { mockGetCurrentUser, mockResetGraphClient } = vi.hoisted(() => ({
  mockGetCurrentUser: vi.fn(),
  mockResetGraphClient: vi.fn(),
}));

vi.mock('../services/auth', () => ({
  initializeMsal: mockInitializeMsal,
  login: mockLogin,
  logout: mockLogout,
  switchAccount: mockSwitchAccount,
  checkStoredAuth: mockCheckStoredAuth,
  getAccessToken: mockGetAccessToken,
  clearCachedAccounts: mockClearCachedAccounts,
}));

vi.mock('../services/graph', () => ({
  getCurrentUser: mockGetCurrentUser,
  resetGraphClient: mockResetGraphClient,
}));

// Import after mocking
import { useAuth } from './useAuth';
import { useAppStore } from '../stores/appStore';

describe('useAuth', () => {
  const mockAccount = {
    homeAccountId: 'test-home-id',
    localAccountId: 'test-local-id',
    environment: 'login.microsoftonline.com',
    tenantId: 'test-tenant',
    username: 'test@example.com',
  };

  const mockUser = {
    id: '12345678-1234-1234-1234-123456789abc',
    displayName: 'Test User',
    mail: 'test@example.com',
    userPrincipalName: 'test@example.com',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the store state
    useAppStore.setState({
      isAuthenticated: false,
      isLoading: true,
      currentUser: null,
      authError: null,
    });

    // Default mock implementations
    mockInitializeMsal.mockResolvedValue({});
    mockCheckStoredAuth.mockResolvedValue(null);
    mockGetAccessToken.mockResolvedValue(null);
  });

  describe('initialization', () => {
    it('should initialize and set loading to false', async () => {
      mockCheckStoredAuth.mockResolvedValue(null);

      const { result } = renderHook(() => useAuth());

      // Initially loading
      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockInitializeMsal).toHaveBeenCalled();
    });

    it('should restore session from cached account', async () => {
      mockCheckStoredAuth.mockResolvedValue(mockAccount);
      mockGetAccessToken.mockResolvedValue('test-token');
      mockGetCurrentUser.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      expect(result.current.currentUser).toEqual(mockUser);
    });

    it('should clear cache when token unavailable', async () => {
      mockCheckStoredAuth.mockResolvedValue(mockAccount);
      mockGetAccessToken.mockResolvedValue(null);

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockClearCachedAccounts).toHaveBeenCalled();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('login', () => {
    it('should login successfully', async () => {
      mockLogin.mockResolvedValue(mockAccount);
      mockGetCurrentUser.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.login();
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.currentUser).toEqual(mockUser);
    });

    it('should handle login error', async () => {
      mockLogin.mockRejectedValue(new Error('Login failed'));

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(async () => {
        await act(async () => {
          await result.current.login();
        });
      }).rejects.toThrow('Login failed');

      expect(result.current.authError).toBe('Failed to sign in. Please try again.');
    });

    it('should ignore user cancellation', async () => {
      mockLogin.mockRejectedValue(new Error('user_cancelled'));

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.login();
      });

      // Should not throw and should not set error
      expect(result.current.authError).toBeNull();
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      // Setup authenticated state
      useAppStore.setState({
        isAuthenticated: true,
        isLoading: false,
        currentUser: mockUser,
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.logout();
      });

      expect(mockLogout).toHaveBeenCalled();
      expect(mockResetGraphClient).toHaveBeenCalled();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.currentUser).toBeNull();
    });

    it('should handle logout error gracefully', async () => {
      mockLogout.mockRejectedValue(new Error('Logout failed'));

      useAppStore.setState({
        isAuthenticated: true,
        isLoading: false,
        currentUser: mockUser,
      });

      const { result } = renderHook(() => useAuth());

      // Should not throw
      await act(async () => {
        await result.current.logout();
      });

      // Logout still resets local state even if API call fails
    });
  });

  describe('switchAccount', () => {
    it('should switch account successfully', async () => {
      const newUser = { ...mockUser, displayName: 'New User' };
      mockSwitchAccount.mockResolvedValue(mockAccount);
      mockGetCurrentUser.mockResolvedValue(newUser);

      useAppStore.setState({
        isAuthenticated: true,
        isLoading: false,
        currentUser: mockUser,
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.switchAccount();
      });

      expect(mockResetGraphClient).toHaveBeenCalled();
      expect(result.current.currentUser).toEqual(newUser);
    });

    it('should handle switch cancellation', async () => {
      mockSwitchAccount.mockRejectedValue(new Error('user_cancelled'));

      useAppStore.setState({
        isAuthenticated: true,
        isLoading: false,
        currentUser: mockUser,
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.switchAccount();
      });

      // Should not throw and should preserve previous state
    });

    it('should throw on switch error', async () => {
      mockSwitchAccount.mockRejectedValue(new Error('Switch failed'));

      useAppStore.setState({
        isAuthenticated: true,
        isLoading: false,
        currentUser: mockUser,
      });

      const { result } = renderHook(() => useAuth());

      await expect(async () => {
        await act(async () => {
          await result.current.switchAccount();
        });
      }).rejects.toThrow('Switch failed');
    });
  });

  describe('return values', () => {
    it('should return expected properties', async () => {
      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current).toHaveProperty('isAuthenticated');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('currentUser');
      expect(result.current).toHaveProperty('authError');
      expect(result.current).toHaveProperty('login');
      expect(result.current).toHaveProperty('logout');
      expect(result.current).toHaveProperty('switchAccount');
    });
  });
});
