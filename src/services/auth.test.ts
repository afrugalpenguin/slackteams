import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import type { AccountInfo, AuthenticationResult } from '@azure/msal-browser';

// Use vi.hoisted to define mocks that can be used in vi.mock factory
const {
  mockLoginPopup,
  mockLogoutPopup,
  mockAcquireTokenSilent,
  mockAcquireTokenPopup,
  mockSetActiveAccount,
  mockGetActiveAccount,
  mockGetAllAccounts,
  mockClearCache,
  mockInitialize,
} = vi.hoisted(() => ({
  mockLoginPopup: vi.fn(),
  mockLogoutPopup: vi.fn(),
  mockAcquireTokenSilent: vi.fn(),
  mockAcquireTokenPopup: vi.fn(),
  mockSetActiveAccount: vi.fn(),
  mockGetActiveAccount: vi.fn(),
  mockGetAllAccounts: vi.fn(),
  mockClearCache: vi.fn(),
  mockInitialize: vi.fn(),
}));

vi.mock('@azure/msal-browser', () => ({
  PublicClientApplication: class {
    initialize = mockInitialize;
    loginPopup = mockLoginPopup;
    logoutPopup = mockLogoutPopup;
    acquireTokenSilent = mockAcquireTokenSilent;
    acquireTokenPopup = mockAcquireTokenPopup;
    setActiveAccount = mockSetActiveAccount;
    getActiveAccount = mockGetActiveAccount;
    getAllAccounts = mockGetAllAccounts;
    clearCache = mockClearCache;
  },
  InteractionRequiredAuthError: class extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'InteractionRequiredAuthError';
    }
  },
}));

// Import after mocking
import {
  initializeMsal,
  getMsalInstance,
  login,
  logout,
  switchAccount,
  getAccessToken,
  getCurrentAccount,
  checkStoredAuth,
  clearCachedAccounts,
  graphScopes,
} from './auth';
import { InteractionRequiredAuthError } from '@azure/msal-browser';

describe('auth service', () => {
  const mockAccount: AccountInfo = {
    homeAccountId: 'test-home-id',
    localAccountId: 'test-local-id',
    environment: 'login.microsoftonline.com',
    tenantId: 'test-tenant',
    username: 'test@example.com',
    name: 'Test User',
  };

  const mockAuthResult: AuthenticationResult = {
    authority: 'https://login.microsoftonline.com/common',
    uniqueId: 'unique-id',
    tenantId: 'test-tenant',
    scopes: graphScopes,
    account: mockAccount,
    idToken: 'id-token',
    idTokenClaims: {},
    accessToken: 'access-token',
    fromCache: false,
    expiresOn: new Date(Date.now() + 3600000),
    tokenType: 'Bearer',
    correlationId: 'correlation-id',
  };

  // Initialize MSAL once for all tests (mirrors production behavior)
  beforeAll(async () => {
    mockInitialize.mockResolvedValue(undefined);
    await initializeMsal();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockInitialize.mockResolvedValue(undefined);
    mockGetAllAccounts.mockReturnValue([]);
    mockGetActiveAccount.mockReturnValue(null);
  });

  describe('initializeMsal', () => {
    it('should return MSAL instance', async () => {
      const msal = await initializeMsal();
      expect(msal).toBeDefined();
    });

    it('should return same instance on subsequent calls', async () => {
      const msal1 = await initializeMsal();
      const msal2 = await initializeMsal();
      expect(msal1).toBe(msal2);
    });
  });

  describe('getMsalInstance', () => {
    it('should return MSAL instance', async () => {
      const msal = await getMsalInstance();
      expect(msal).toBeDefined();
    });
  });

  describe('login', () => {
    it('should successfully login and return account', async () => {
      mockLoginPopup.mockResolvedValue(mockAuthResult);

      const account = await login();

      expect(account).toEqual(mockAccount);
      expect(mockLoginPopup).toHaveBeenCalledWith({
        scopes: graphScopes,
        prompt: 'select_account',
      });
      expect(mockSetActiveAccount).toHaveBeenCalledWith(mockAccount);
    });

    it('should return null if no account in result', async () => {
      mockLoginPopup.mockResolvedValue({ ...mockAuthResult, account: null });

      const account = await login();

      expect(account).toBeNull();
    });

    it('should throw error when login fails', async () => {
      mockLoginPopup.mockRejectedValue(new Error('Login failed'));

      await expect(login()).rejects.toThrow('Login failed');
    });
  });

  describe('logout', () => {
    it('should logout when account exists', async () => {
      mockGetActiveAccount.mockReturnValue(mockAccount);

      await logout();

      expect(mockLogoutPopup).toHaveBeenCalledWith({
        account: mockAccount,
      });
    });

    it('should not call logoutPopup when no account', async () => {
      mockGetActiveAccount.mockReturnValue(null);

      await logout();

      expect(mockLogoutPopup).not.toHaveBeenCalled();
    });
  });

  describe('switchAccount', () => {
    it('should clear cache and login with new account', async () => {
      mockGetAllAccounts.mockReturnValue([mockAccount]);
      mockLoginPopup.mockResolvedValue(mockAuthResult);

      const account = await switchAccount();

      expect(mockClearCache).toHaveBeenCalled();
      expect(mockLoginPopup).toHaveBeenCalledWith({
        scopes: graphScopes,
        prompt: 'select_account',
      });
      expect(account).toEqual(mockAccount);
    });

    it('should throw error when switch fails', async () => {
      mockGetAllAccounts.mockReturnValue([]);
      mockLoginPopup.mockRejectedValue(new Error('Switch failed'));

      await expect(switchAccount()).rejects.toThrow('Switch failed');
    });
  });

  describe('getAccessToken', () => {
    it('should return token from silent acquisition', async () => {
      mockGetActiveAccount.mockReturnValue(mockAccount);
      mockAcquireTokenSilent.mockResolvedValue(mockAuthResult);

      const token = await getAccessToken();

      expect(token).toBe('access-token');
      expect(mockAcquireTokenSilent).toHaveBeenCalledWith({
        scopes: graphScopes,
        account: mockAccount,
      });
    });

    it('should return null when no active or cached accounts', async () => {
      mockGetActiveAccount.mockReturnValue(null);
      mockGetAllAccounts.mockReturnValue([]);

      const token = await getAccessToken();

      expect(token).toBeNull();
    });

    it('should use first cached account when no active account', async () => {
      mockGetActiveAccount
        .mockReturnValueOnce(null)
        .mockReturnValue(mockAccount);
      mockGetAllAccounts.mockReturnValue([mockAccount]);
      mockAcquireTokenSilent.mockResolvedValue(mockAuthResult);

      const token = await getAccessToken();

      expect(token).toBe('access-token');
      expect(mockSetActiveAccount).toHaveBeenCalledWith(mockAccount);
    });

    it('should fallback to popup when interaction required', async () => {
      mockGetActiveAccount.mockReturnValue(mockAccount);
      mockAcquireTokenSilent.mockRejectedValue(
        new InteractionRequiredAuthError('interaction_required')
      );
      mockAcquireTokenPopup.mockResolvedValue(mockAuthResult);

      const token = await getAccessToken();

      expect(token).toBe('access-token');
      expect(mockAcquireTokenPopup).toHaveBeenCalled();
    });

    it('should return null when popup fails', async () => {
      mockGetActiveAccount.mockReturnValue(mockAccount);
      mockAcquireTokenSilent.mockRejectedValue(
        new InteractionRequiredAuthError('interaction_required')
      );
      mockAcquireTokenPopup.mockRejectedValue(new Error('Popup failed'));

      const token = await getAccessToken();

      expect(token).toBeNull();
    });

    it('should return null on other errors', async () => {
      mockGetActiveAccount.mockReturnValue(mockAccount);
      mockAcquireTokenSilent.mockRejectedValue(new Error('Unknown error'));

      const token = await getAccessToken();

      expect(token).toBeNull();
    });
  });

  describe('getCurrentAccount', () => {
    it('should return active account', async () => {
      mockGetActiveAccount.mockReturnValue(mockAccount);

      const account = await getCurrentAccount();

      expect(account).toEqual(mockAccount);
    });

    it('should return null when no active account', async () => {
      mockGetActiveAccount.mockReturnValue(null);

      const account = await getCurrentAccount();

      expect(account).toBeNull();
    });
  });

  describe('checkStoredAuth', () => {
    it('should return first account from cache', async () => {
      mockGetAllAccounts.mockReturnValue([mockAccount]);

      const account = await checkStoredAuth();

      expect(account).toEqual(mockAccount);
      expect(mockSetActiveAccount).toHaveBeenCalledWith(mockAccount);
    });

    it('should return null when no cached accounts', async () => {
      mockGetAllAccounts.mockReturnValue([]);

      const account = await checkStoredAuth();

      expect(account).toBeNull();
    });
  });

  describe('clearCachedAccounts', () => {
    it('should clear cache for all accounts', async () => {
      mockGetAllAccounts.mockReturnValue([mockAccount]);

      await clearCachedAccounts();

      expect(mockClearCache).toHaveBeenCalledWith({ account: mockAccount });
    });

    it('should handle multiple accounts', async () => {
      const account2: AccountInfo = { ...mockAccount, homeAccountId: 'test-2' };
      mockGetAllAccounts.mockReturnValue([mockAccount, account2]);

      await clearCachedAccounts();

      expect(mockClearCache).toHaveBeenCalledTimes(2);
    });
  });

  describe('graphScopes', () => {
    it('should export required scopes', () => {
      expect(graphScopes).toContain('User.Read');
      expect(graphScopes).toContain('Team.ReadBasic.All');
      expect(graphScopes).toContain('Channel.ReadBasic.All');
      expect(graphScopes).toContain('Chat.Read');
      expect(graphScopes).toContain('Presence.Read.All');
    });
  });
});
