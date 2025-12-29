import {
  PublicClientApplication,
  InteractionRequiredAuthError,
  type Configuration,
  type AccountInfo,
  type AuthenticationResult,
} from '@azure/msal-browser';
import { logger } from '../utils';

// Check if running in Tauri
const isTauri = '__TAURI__' in window;

// Azure AD configuration from environment variables
const redirectUri = import.meta.env.VITE_REDIRECT_URI || window.location.origin;
const authority = import.meta.env.VITE_AZURE_AUTHORITY || 'https://login.microsoftonline.com/common';

const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID || '',
    authority,
    redirectUri,
    postLogoutRedirectUri: redirectUri,
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false,
  },
};

// Validate required configuration
if (!import.meta.env.VITE_AZURE_CLIENT_ID) {
  logger.error('VITE_AZURE_CLIENT_ID is not configured. Please set it in your .env file.');
}

// Microsoft Graph API scopes
export const graphScopes = [
  'User.Read',
  'Team.ReadBasic.All',
  'Channel.ReadBasic.All',
  'ChannelMessage.Read.All',
  'ChannelMessage.Send',
  'Chat.Read',
  'Chat.ReadWrite',
  'Presence.Read.All',
];

let msalInstance: PublicClientApplication | null = null;

export async function initializeMsal(): Promise<PublicClientApplication> {
  if (msalInstance) {
    return msalInstance;
  }

  msalInstance = new PublicClientApplication(msalConfig);
  await msalInstance.initialize();
  return msalInstance;
}

export async function getMsalInstance(): Promise<PublicClientApplication> {
  if (!msalInstance) {
    return initializeMsal();
  }
  return msalInstance;
}

export async function clearCachedAccounts(): Promise<void> {
  const msal = await getMsalInstance();
  const accounts = msal.getAllAccounts();
  for (const account of accounts) {
    await msal.clearCache({ account });
  }
}

export async function login(): Promise<AccountInfo | null> {
  const msal = await getMsalInstance();

  try {
    const result = await msal.loginPopup({
      scopes: graphScopes,
      prompt: 'select_account', // Always show account picker
    });

    if (result.account) {
      msal.setActiveAccount(result.account);
      await storeTokenSecurely(result);
      return result.account;
    }
    return null;
  } catch (error) {
    logger.error('Login error:', error);
    throw error;
  }
}

export async function logout(): Promise<void> {
  const msal = await getMsalInstance();
  const account = msal.getActiveAccount();

  if (account) {
    await deleteStoredToken();
    await msal.logoutPopup({
      account,
    });
  }
}

export async function switchAccount(): Promise<AccountInfo | null> {
  const msal = await getMsalInstance();

  // Clear all cached accounts
  await clearCachedAccounts();
  await deleteStoredToken();

  // Trigger fresh login with account picker
  try {
    const result = await msal.loginPopup({
      scopes: graphScopes,
      prompt: 'select_account',
    });

    if (result.account) {
      msal.setActiveAccount(result.account);
      await storeTokenSecurely(result);
      return result.account;
    }
    return null;
  } catch (error) {
    logger.error('Switch account error:', error);
    throw error;
  }
}

export async function getAccessToken(): Promise<string | null> {
  const msal = await getMsalInstance();
  const account = msal.getActiveAccount();

  if (!account) {
    // Try to get cached account
    const accounts = msal.getAllAccounts();
    if (accounts.length > 0) {
      msal.setActiveAccount(accounts[0]);
    } else {
      return null;
    }
  }

  try {
    const result = await msal.acquireTokenSilent({
      scopes: graphScopes,
      account: msal.getActiveAccount()!,
    });
    return result.accessToken;
  } catch (error) {
    if (error instanceof InteractionRequiredAuthError) {
      // Token expired, need to re-authenticate
      try {
        const result = await msal.acquireTokenPopup({
          scopes: graphScopes,
        });
        await storeTokenSecurely(result);
        return result.accessToken;
      } catch (popupError) {
        logger.error('Token acquisition failed:', popupError);
        return null;
      }
    }
    logger.error('Token acquisition error:', error);
    return null;
  }
}

export async function getCurrentAccount(): Promise<AccountInfo | null> {
  const msal = await getMsalInstance();
  return msal.getActiveAccount();
}

export async function checkStoredAuth(): Promise<AccountInfo | null> {
  const msal = await getMsalInstance();
  const accounts = msal.getAllAccounts();

  if (accounts.length > 0) {
    msal.setActiveAccount(accounts[0]);
    return accounts[0];
  }

  return null;
}

// Secure token storage using Tauri keyring (falls back to localStorage in browser)
interface TokenResult {
  success: boolean;
  error?: string;
  value?: string;
}

async function storeTokenSecurely(result: AuthenticationResult): Promise<void> {
  try {
    const tokenData = JSON.stringify({
      accessToken: result.accessToken,
      expiresOn: result.expiresOn?.toISOString(),
      account: result.account,
    });

    if (isTauri) {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke<TokenResult>('store_token', {
        key: 'auth_token',
        value: tokenData,
      });
    } else {
      // Fallback to localStorage in browser
      localStorage.setItem('slackteams_auth', tokenData);
    }
  } catch (error) {
    logger.error('Failed to store token securely:', error);
  }
}

async function deleteStoredToken(): Promise<void> {
  try {
    if (isTauri) {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke<TokenResult>('delete_token', { key: 'auth_token' });
    } else {
      localStorage.removeItem('slackteams_auth');
    }
  } catch (error) {
    logger.error('Failed to delete stored token:', error);
  }
}
