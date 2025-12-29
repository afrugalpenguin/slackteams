import { describe, it, expect, vi, beforeEach } from 'vitest';

// Use vi.hoisted to define mocks
const { mockApi, mockGet, mockPost, mockTop, mockSelect, mockExpand } = vi.hoisted(() => {
  const mockTop = vi.fn();
  const mockSelect = vi.fn();
  const mockExpand = vi.fn();
  const mockGet = vi.fn();
  const mockPost = vi.fn();

  // Chain methods return themselves for chaining
  mockTop.mockReturnValue({ get: mockGet, post: mockPost });
  mockSelect.mockReturnValue({ get: mockGet, top: mockTop, expand: mockExpand });
  mockExpand.mockReturnValue({ get: mockGet, select: mockSelect, top: mockTop });

  const mockApi = vi.fn().mockReturnValue({
    select: mockSelect,
    get: mockGet,
    post: mockPost,
    top: mockTop,
    expand: mockExpand,
  });

  return { mockApi, mockGet, mockPost, mockTop, mockSelect, mockExpand };
});

// Mock getAccessToken from auth
const { mockGetAccessToken } = vi.hoisted(() => ({
  mockGetAccessToken: vi.fn(),
}));

vi.mock('@microsoft/microsoft-graph-client', () => ({
  Client: {
    init: vi.fn().mockReturnValue({
      api: mockApi,
    }),
  },
}));

vi.mock('./auth', () => ({
  getAccessToken: mockGetAccessToken,
  clearCachedAccounts: vi.fn(),
}));

vi.mock('../stores/appStore', () => ({
  useAppStore: {
    getState: () => ({
      setAuthenticated: vi.fn(),
      setCurrentUser: vi.fn(),
    }),
  },
}));

// Import after mocking
import {
  getCurrentUser,
  getUserPhoto,
  getJoinedTeams,
  getTeamChannels,
  getChannelMessages,
  getMessageReplies,
  sendChannelMessage,
  replyToMessage,
  getChats,
  getChatMessages,
  sendChatMessage,
  getPresence,
  getMultiplePresence,
  setMyPresence,
  searchMessages,
  resetGraphClient,
} from './graph';

describe('graph service', () => {
  const mockUser = {
    id: '12345678-1234-1234-1234-123456789abc',
    displayName: 'Test User',
    mail: 'test@example.com',
  };

  const mockTeam = {
    id: '12345678-1234-1234-1234-123456789abc',
    displayName: 'Test Team',
    description: 'A test team',
  };

  const mockChannel = {
    id: '19:abc123@thread.tacv2',
    displayName: 'General',
  };

  const mockMessage = {
    id: '1234567890123',
    body: { content: 'Hello world' },
    from: { user: mockUser },
    createdDateTime: '2024-01-01T12:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAccessToken.mockResolvedValue('test-token');
    // Reset the graph client for each test
    resetGraphClient();
  });

  describe('getCurrentUser', () => {
    it('should fetch current user', async () => {
      mockGet.mockResolvedValue(mockUser);

      const user = await getCurrentUser();

      expect(user).toEqual(mockUser);
      expect(mockApi).toHaveBeenCalledWith('/me');
      expect(mockSelect).toHaveBeenCalledWith(
        'id,displayName,mail,userPrincipalName,givenName,surname,jobTitle'
      );
    });
  });

  describe('getUserPhoto', () => {
    it('should fetch user photo by ID', async () => {
      const mockBlob = new Blob(['test'], { type: 'image/jpeg' });
      mockGet.mockResolvedValue(mockBlob);

      const photoUrl = await getUserPhoto('12345678-1234-1234-1234-123456789abc');

      expect(mockApi).toHaveBeenCalledWith('/users/12345678-1234-1234-1234-123456789abc/photo/$value');
      expect(photoUrl).toBeTruthy();
    });

    it('should fetch current user photo when no ID provided', async () => {
      const mockBlob = new Blob(['test'], { type: 'image/jpeg' });
      mockGet.mockResolvedValue(mockBlob);

      const photoUrl = await getUserPhoto();

      expect(mockApi).toHaveBeenCalledWith('/me/photo/$value');
      expect(photoUrl).toBeTruthy();
    });

    it('should return null on error', async () => {
      mockGet.mockRejectedValue(new Error('Not found'));

      const photoUrl = await getUserPhoto('12345678-1234-1234-1234-123456789abc');

      expect(photoUrl).toBeNull();
    });
  });

  describe('getJoinedTeams', () => {
    it('should fetch joined teams', async () => {
      mockGet.mockResolvedValue({ value: [mockTeam] });

      const teams = await getJoinedTeams();

      expect(teams).toEqual([mockTeam]);
      expect(mockApi).toHaveBeenCalledWith('/me/joinedTeams');
    });
  });

  describe('getTeamChannels', () => {
    it('should fetch team channels', async () => {
      mockGet.mockResolvedValue({ value: [mockChannel] });

      const channels = await getTeamChannels('12345678-1234-1234-1234-123456789abc');

      expect(channels).toEqual([mockChannel]);
      expect(mockApi).toHaveBeenCalledWith('/teams/12345678-1234-1234-1234-123456789abc/channels');
    });

    it('should validate team ID', async () => {
      await expect(getTeamChannels('invalid-id')).rejects.toThrow('must be a valid GUID');
    });
  });

  describe('getChannelMessages', () => {
    it('should fetch channel messages', async () => {
      const messages = [
        { ...mockMessage, createdDateTime: '2024-01-01T12:00:00Z' },
        { ...mockMessage, id: '2', createdDateTime: '2024-01-01T11:00:00Z' },
      ];
      mockGet.mockResolvedValue({ value: messages });

      const result = await getChannelMessages(
        '12345678-1234-1234-1234-123456789abc',
        '19:abc123@thread.tacv2'
      );

      expect(result).toHaveLength(2);
      // Should be sorted chronologically (oldest first)
      expect(result[0].createdDateTime).toBe('2024-01-01T11:00:00Z');
      expect(mockApi).toHaveBeenCalledWith(
        '/teams/12345678-1234-1234-1234-123456789abc/channels/19:abc123@thread.tacv2/messages'
      );
    });

    it('should validate team and channel IDs', async () => {
      await expect(
        getChannelMessages('invalid', '19:abc@thread.tacv2')
      ).rejects.toThrow('must be a valid GUID');
    });
  });

  describe('getMessageReplies', () => {
    it('should fetch message replies', async () => {
      const replies = [mockMessage];
      mockGet.mockResolvedValue({ value: replies });

      const result = await getMessageReplies(
        '12345678-1234-1234-1234-123456789abc',
        '19:abc123@thread.tacv2',
        '1234567890123'
      );

      expect(result).toEqual(replies);
      expect(mockApi).toHaveBeenCalledWith(
        '/teams/12345678-1234-1234-1234-123456789abc/channels/19:abc123@thread.tacv2/messages/1234567890123/replies'
      );
    });
  });

  describe('sendChannelMessage', () => {
    it('should send channel message', async () => {
      mockPost.mockResolvedValue(mockMessage);

      const result = await sendChannelMessage(
        '12345678-1234-1234-1234-123456789abc',
        '19:abc123@thread.tacv2',
        'Hello world'
      );

      expect(result).toEqual(mockMessage);
      expect(mockPost).toHaveBeenCalledWith({
        body: {
          content: 'Hello world',
          contentType: 'html',
        },
      });
    });
  });

  describe('replyToMessage', () => {
    it('should reply to message', async () => {
      mockPost.mockResolvedValue(mockMessage);

      const result = await replyToMessage(
        '12345678-1234-1234-1234-123456789abc',
        '19:abc123@thread.tacv2',
        '1234567890123',
        'Reply content'
      );

      expect(result).toEqual(mockMessage);
      expect(mockPost).toHaveBeenCalledWith({
        body: {
          content: 'Reply content',
          contentType: 'html',
        },
      });
    });
  });

  describe('getChats', () => {
    it('should fetch chats sorted by lastUpdatedDateTime', async () => {
      const chats = [
        { id: '1', lastUpdatedDateTime: '2024-01-01T10:00:00Z' },
        { id: '2', lastUpdatedDateTime: '2024-01-01T12:00:00Z' },
      ];
      mockGet.mockResolvedValue({ value: chats });

      const result = await getChats();

      // Should be sorted by lastUpdatedDateTime descending (newest first)
      expect(result[0].lastUpdatedDateTime).toBe('2024-01-01T12:00:00Z');
      expect(mockApi).toHaveBeenCalledWith('/me/chats');
    });
  });

  describe('getChatMessages', () => {
    it('should fetch chat messages', async () => {
      const messages = [mockMessage];
      mockGet.mockResolvedValue({ value: messages });

      const result = await getChatMessages('19:abc_def@unq.gbl.spaces');

      expect(result).toEqual(messages);
    });

    it('should validate chat ID', async () => {
      await expect(getChatMessages('../invalid')).rejects.toThrow('invalid characters');
    });
  });

  describe('sendChatMessage', () => {
    it('should send chat message', async () => {
      mockPost.mockResolvedValue(mockMessage);

      const result = await sendChatMessage('19:abc_def@unq.gbl.spaces', 'Hello');

      expect(result).toEqual(mockMessage);
      expect(mockPost).toHaveBeenCalledWith({
        body: {
          content: 'Hello',
          contentType: 'html',
        },
      });
    });
  });

  describe('getPresence', () => {
    it('should fetch user presence', async () => {
      const presence = { availability: 'Available', activity: 'Available' };
      mockGet.mockResolvedValue(presence);

      const result = await getPresence('12345678-1234-1234-1234-123456789abc');

      expect(result).toEqual(presence);
      expect(mockApi).toHaveBeenCalledWith('/users/12345678-1234-1234-1234-123456789abc/presence');
    });
  });

  describe('getMultiplePresence', () => {
    it('should fetch multiple presences', async () => {
      const presences = [
        { id: '12345678-1234-1234-1234-123456789abc', availability: 'Available' },
      ];
      mockPost.mockResolvedValue({ value: presences });

      const result = await getMultiplePresence(['12345678-1234-1234-1234-123456789abc']);

      expect(result).toEqual(presences);
      expect(mockApi).toHaveBeenCalledWith('/communications/getPresencesByUserId');
    });

    it('should return empty array for empty input', async () => {
      const result = await getMultiplePresence([]);

      expect(result).toEqual([]);
      expect(mockPost).not.toHaveBeenCalled();
    });
  });

  describe('setMyPresence', () => {
    it('should set presence', async () => {
      mockPost.mockResolvedValue({});

      await setMyPresence('Available', 'Available');

      expect(mockApi).toHaveBeenCalledWith('/me/presence/setPresence');
      expect(mockPost).toHaveBeenCalledWith({
        sessionId: 'slackteams',
        availability: 'Available',
        activity: 'Available',
        expirationDuration: 'PT1H',
      });
    });
  });

  describe('searchMessages', () => {
    it('should search messages', async () => {
      const searchResult = {
        value: [
          {
            hitsContainers: [
              {
                hits: [{ resource: mockMessage }],
              },
            ],
          },
        ],
      };
      mockPost.mockResolvedValue(searchResult);

      const result = await searchMessages('test query');

      expect(result).toEqual([mockMessage]);
      expect(mockApi).toHaveBeenCalledWith('/search/query');
    });

    it('should return empty array when no hits', async () => {
      mockPost.mockResolvedValue({ value: [] });

      const result = await searchMessages('no results');

      expect(result).toEqual([]);
    });
  });

  describe('resetGraphClient', () => {
    it('should reset client without throwing', () => {
      expect(() => resetGraphClient()).not.toThrow();
    });
  });
});
