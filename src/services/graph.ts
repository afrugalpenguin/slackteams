import { Client } from '@microsoft/microsoft-graph-client';
import { getAccessToken, clearCachedAccounts } from './auth';
import { useAppStore } from '../stores/appStore';
import {
  safeApiCall,
  validateTeamId,
  validateChannelId,
  validateChatId,
  validateMessageId,
  validateUserId,
} from '../utils';
import type {
  User,
  Team,
  Channel,
  ChatMessage,
  Chat,
  Presence,
} from '../types';

let graphClient: Client | null = null;
let graphClientPromise: Promise<Client> | null = null;

async function getGraphClient(): Promise<Client> {
  if (graphClient) {
    return graphClient;
  }

  // Prevent race condition - reuse existing initialization promise
  if (graphClientPromise) {
    return graphClientPromise;
  }

  graphClientPromise = (async () => {
    const client = Client.init({
      authProvider: async (done) => {
        const token = await getAccessToken();
        if (token) {
          done(null, token);
        } else {
          // Reset auth state and clear cache when token is unavailable
          graphClient = null;
          graphClientPromise = null;
          await clearCachedAccounts();
          useAppStore.getState().setAuthenticated(false);
          useAppStore.getState().setCurrentUser(null);
          done(new Error('No access token available - please log in again'), null);
        }
      },
    });
    graphClient = client;
    return client;
  })();

  return graphClientPromise;
}

// Reset client (useful after logout)
export function resetGraphClient(): void {
  graphClient = null;
  graphClientPromise = null;
}

// User operations
export async function getCurrentUser(): Promise<User> {
  return safeApiCall(async () => {
    const client = await getGraphClient();
    const response = await client
      .api('/me')
      .select('id,displayName,mail,userPrincipalName,givenName,surname,jobTitle')
      .get();
    return response;
  }, 'getCurrentUser');
}

export async function getUserPhoto(userId?: string): Promise<string | null> {
  try {
    const client = await getGraphClient();
    const endpoint = userId
      ? `/users/${validateUserId(userId)}/photo/$value`
      : '/me/photo/$value';
    const response = await client.api(endpoint).get();
    const blob = new Blob([response], { type: 'image/jpeg' });
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}

// Teams operations
export async function getJoinedTeams(): Promise<Team[]> {
  return safeApiCall(async () => {
    const client = await getGraphClient();
    const response = await client
      .api('/me/joinedTeams')
      .select('id,displayName,description,isArchived')
      .get();
    return response.value;
  }, 'getJoinedTeams');
}

export async function getTeamChannels(teamId: string): Promise<Channel[]> {
  const validTeamId = validateTeamId(teamId);
  return safeApiCall(async () => {
    const client = await getGraphClient();
    const response = await client
      .api(`/teams/${validTeamId}/channels`)
      .select('id,displayName,description,membershipType,webUrl')
      .get();
    return response.value;
  }, 'getTeamChannels');
}

// Channel messages
export async function getChannelMessages(
  teamId: string,
  channelId: string,
  top: number = 50
): Promise<ChatMessage[]> {
  const validTeamId = validateTeamId(teamId);
  const validChannelId = validateChannelId(channelId);
  return safeApiCall(async () => {
    const client = await getGraphClient();
    const response = await client
      .api(`/teams/${validTeamId}/channels/${validChannelId}/messages`)
      .top(top)
      .get();

    // Sort client-side in chronological order (oldest first)
    const messages = response.value as ChatMessage[];
    return messages.sort((a, b) => {
      const dateA = a.createdDateTime ? new Date(a.createdDateTime).getTime() : 0;
      const dateB = b.createdDateTime ? new Date(b.createdDateTime).getTime() : 0;
      return dateA - dateB;
    });
  }, 'getChannelMessages');
}

export async function getMessageReplies(
  teamId: string,
  channelId: string,
  messageId: string
): Promise<ChatMessage[]> {
  const validTeamId = validateTeamId(teamId);
  const validChannelId = validateChannelId(channelId);
  const validMessageId = validateMessageId(messageId);
  return safeApiCall(async () => {
    const client = await getGraphClient();
    const response = await client
      .api(`/teams/${validTeamId}/channels/${validChannelId}/messages/${validMessageId}/replies`)
      .get();

    // Sort client-side in chronological order (oldest first)
    const replies = response.value as ChatMessage[];
    return replies.sort((a, b) => {
      const dateA = a.createdDateTime ? new Date(a.createdDateTime).getTime() : 0;
      const dateB = b.createdDateTime ? new Date(b.createdDateTime).getTime() : 0;
      return dateA - dateB;
    });
  }, 'getMessageReplies');
}

export async function sendChannelMessage(
  teamId: string,
  channelId: string,
  content: string
): Promise<ChatMessage> {
  const validTeamId = validateTeamId(teamId);
  const validChannelId = validateChannelId(channelId);
  return safeApiCall(async () => {
    const client = await getGraphClient();
    const message = {
      body: {
        content,
        contentType: 'html',
      },
    };
    const response = await client
      .api(`/teams/${validTeamId}/channels/${validChannelId}/messages`)
      .post(message);
    return response;
  }, 'sendChannelMessage');
}

export async function replyToMessage(
  teamId: string,
  channelId: string,
  messageId: string,
  content: string
): Promise<ChatMessage> {
  const validTeamId = validateTeamId(teamId);
  const validChannelId = validateChannelId(channelId);
  const validMessageId = validateMessageId(messageId);
  return safeApiCall(async () => {
    const client = await getGraphClient();
    const reply = {
      body: {
        content,
        contentType: 'html',
      },
    };
    const response = await client
      .api(`/teams/${validTeamId}/channels/${validChannelId}/messages/${validMessageId}/replies`)
      .post(reply);
    return response;
  }, 'replyToMessage');
}

// Direct messages (Chats)
export async function getChats(): Promise<Chat[]> {
  return safeApiCall(async () => {
    const client = await getGraphClient();
    const response = await client
      .api('/me/chats')
      .expand('members')
      .select('id,chatType,topic,lastUpdatedDateTime')
      .top(50)
      .get();

    // Sort client-side since Graph API doesn't support orderby on chats
    const chats = response.value as Chat[];
    return chats.sort((a, b) => {
      const dateA = a.lastUpdatedDateTime ? new Date(a.lastUpdatedDateTime).getTime() : 0;
      const dateB = b.lastUpdatedDateTime ? new Date(b.lastUpdatedDateTime).getTime() : 0;
      return dateB - dateA;
    });
  }, 'getChats');
}

export async function getChatMessages(
  chatId: string,
  top: number = 50
): Promise<ChatMessage[]> {
  const validChatId = validateChatId(chatId);
  return safeApiCall(async () => {
    const client = await getGraphClient();
    const response = await client
      .api(`/me/chats/${validChatId}/messages`)
      .top(top)
      .get();

    // Sort client-side in chronological order (oldest first)
    const messages = response.value as ChatMessage[];
    return messages.sort((a, b) => {
      const dateA = a.createdDateTime ? new Date(a.createdDateTime).getTime() : 0;
      const dateB = b.createdDateTime ? new Date(b.createdDateTime).getTime() : 0;
      return dateA - dateB;
    });
  }, 'getChatMessages');
}

export async function sendChatMessage(
  chatId: string,
  content: string
): Promise<ChatMessage> {
  const validChatId = validateChatId(chatId);
  return safeApiCall(async () => {
    const client = await getGraphClient();
    const message = {
      body: {
        content,
        contentType: 'html',
      },
    };
    const response = await client
      .api(`/me/chats/${validChatId}/messages`)
      .post(message);
    return response;
  }, 'sendChatMessage');
}

// Presence
export async function getPresence(userId: string): Promise<Presence> {
  const validUserId = validateUserId(userId);
  return safeApiCall(async () => {
    const client = await getGraphClient();
    const response = await client.api(`/users/${validUserId}/presence`).get();
    return response;
  }, 'getPresence');
}

export async function getMultiplePresence(userIds: string[]): Promise<Presence[]> {
  if (userIds.length === 0) return [];

  const validUserIds = userIds.map((id) => validateUserId(id));
  return safeApiCall(async () => {
    const client = await getGraphClient();
    const response = await client
      .api('/communications/getPresencesByUserId')
      .post({ ids: validUserIds });
    return response.value;
  }, 'getMultiplePresence');
}

export async function setMyPresence(
  availability: string,
  activity: string
): Promise<void> {
  return safeApiCall(async () => {
    const client = await getGraphClient();
    await client.api('/me/presence/setPresence').post({
      sessionId: 'slackteams',
      availability,
      activity,
      expirationDuration: 'PT1H',
    });
  }, 'setMyPresence');
}

// Search
export async function searchMessages(query: string): Promise<ChatMessage[]> {
  return safeApiCall(async () => {
    const client = await getGraphClient();
    const response = await client
      .api('/search/query')
      .post({
        requests: [
          {
            entityTypes: ['chatMessage'],
            query: { queryString: query },
            from: 0,
            size: 25,
          },
        ],
      });

    // Extract messages from search results
    const hits = response.value?.[0]?.hitsContainers?.[0]?.hits || [];
    return hits.map((hit: { resource: ChatMessage }) => hit.resource);
  }, 'searchMessages');
}
