import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// Mock the graph service
const {
  mockGetJoinedTeams,
  mockGetTeamChannels,
  mockGetChannelMessages,
  mockSendChannelMessage,
  mockGetMessageReplies,
  mockReplyToMessage,
  mockGetChats,
  mockGetChatMessages,
  mockSendChatMessage,
} = vi.hoisted(() => ({
  mockGetJoinedTeams: vi.fn(),
  mockGetTeamChannels: vi.fn(),
  mockGetChannelMessages: vi.fn(),
  mockSendChannelMessage: vi.fn(),
  mockGetMessageReplies: vi.fn(),
  mockReplyToMessage: vi.fn(),
  mockGetChats: vi.fn(),
  mockGetChatMessages: vi.fn(),
  mockSendChatMessage: vi.fn(),
}));

vi.mock('../services/graph', () => ({
  getJoinedTeams: mockGetJoinedTeams,
  getTeamChannels: mockGetTeamChannels,
  getChannelMessages: mockGetChannelMessages,
  sendChannelMessage: mockSendChannelMessage,
  getMessageReplies: mockGetMessageReplies,
  replyToMessage: mockReplyToMessage,
  getChats: mockGetChats,
  getChatMessages: mockGetChatMessages,
  sendChatMessage: mockSendChatMessage,
}));

// Import after mocking
import { useTeams } from './useTeams';
import { useAppStore } from '../stores/appStore';

describe('useTeams', () => {
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
    createdDateTime: '2024-01-01T12:00:00Z',
  };

  const mockChat = {
    id: '19:abc_def@unq.gbl.spaces',
    chatType: 'oneOnOne',
    lastUpdatedDateTime: '2024-01-01T12:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset the store state - start as not authenticated to avoid auto-loading
    useAppStore.setState({
      isAuthenticated: false,
      isLoading: false,
      currentUser: null,
      teams: [],
      teamsLoading: false,
      selectedItem: null,
      messages: [],
      messagesLoading: false,
      chats: [],
      chatsLoading: false,
      thread: { isOpen: false },
    });

    // Default mock implementations
    mockGetJoinedTeams.mockResolvedValue([mockTeam]);
    mockGetTeamChannels.mockResolvedValue([mockChannel]);
    mockGetChannelMessages.mockResolvedValue([mockMessage]);
    mockGetChats.mockResolvedValue([mockChat]);
    mockGetChatMessages.mockResolvedValue([mockMessage]);
    mockSendChannelMessage.mockResolvedValue(mockMessage);
    mockSendChatMessage.mockResolvedValue(mockMessage);
    mockGetMessageReplies.mockResolvedValue([]);
    mockReplyToMessage.mockResolvedValue(mockMessage);
  });

  describe('sendMessage', () => {
    it('should send channel message', async () => {
      useAppStore.setState({
        isAuthenticated: true,
        selectedItem: {
          type: 'channel',
          teamId: mockTeam.id,
          channelId: mockChannel.id,
          name: 'General',
        },
      });

      const { result } = renderHook(() => useTeams());

      await act(async () => {
        await result.current.sendMessage('Hello world');
      });

      expect(mockSendChannelMessage).toHaveBeenCalledWith(
        mockTeam.id,
        mockChannel.id,
        'Hello world'
      );
    });

    it('should send chat message', async () => {
      useAppStore.setState({
        isAuthenticated: true,
        selectedItem: {
          type: 'chat',
          chatId: mockChat.id,
          name: 'Test Chat',
        },
      });

      const { result } = renderHook(() => useTeams());

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      expect(mockSendChatMessage).toHaveBeenCalledWith(mockChat.id, 'Hello');
    });

    it('should not send message when no item selected', async () => {
      useAppStore.setState({ isAuthenticated: true, selectedItem: null });

      const { result } = renderHook(() => useTeams());

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      expect(mockSendChannelMessage).not.toHaveBeenCalled();
      expect(mockSendChatMessage).not.toHaveBeenCalled();
    });

    it('should handle send message error', async () => {
      mockSendChannelMessage.mockRejectedValue(new Error('Send failed'));
      useAppStore.setState({
        isAuthenticated: true,
        selectedItem: {
          type: 'channel',
          teamId: mockTeam.id,
          channelId: mockChannel.id,
          name: 'General',
        },
      });

      const { result } = renderHook(() => useTeams());

      await expect(async () => {
        await act(async () => {
          await result.current.sendMessage('Hello');
        });
      }).rejects.toThrow('Send failed');
    });
  });

  describe('openMessageThread', () => {
    it('should open thread with replies', async () => {
      const replies = [{ ...mockMessage, id: 'reply-1' }];
      mockGetMessageReplies.mockResolvedValue(replies);

      useAppStore.setState({
        isAuthenticated: true,
        selectedItem: {
          type: 'channel',
          teamId: mockTeam.id,
          channelId: mockChannel.id,
          name: 'General',
        },
        messages: [mockMessage],
      });

      const { result } = renderHook(() => useTeams());

      await act(async () => {
        await result.current.openMessageThread(mockMessage.id);
      });

      expect(mockGetMessageReplies).toHaveBeenCalledWith(
        mockTeam.id,
        mockChannel.id,
        mockMessage.id
      );

      expect(result.current.thread.isOpen).toBe(true);
    });

    it('should not open thread for chat (not channel)', async () => {
      useAppStore.setState({
        isAuthenticated: true,
        selectedItem: {
          type: 'chat',
          chatId: mockChat.id,
          name: 'Test Chat',
        },
        messages: [mockMessage],
      });

      const { result } = renderHook(() => useTeams());

      await act(async () => {
        await result.current.openMessageThread(mockMessage.id);
      });

      expect(mockGetMessageReplies).not.toHaveBeenCalled();
    });

    it('should not open thread for non-existent message', async () => {
      useAppStore.setState({
        isAuthenticated: true,
        selectedItem: {
          type: 'channel',
          teamId: mockTeam.id,
          channelId: mockChannel.id,
          name: 'General',
        },
        messages: [],
      });

      const { result } = renderHook(() => useTeams());

      await act(async () => {
        await result.current.openMessageThread('non-existent');
      });

      expect(mockGetMessageReplies).not.toHaveBeenCalled();
    });
  });

  describe('sendReply', () => {
    it('should send reply to thread', async () => {
      useAppStore.setState({
        isAuthenticated: true,
        thread: {
          isOpen: true,
          teamId: mockTeam.id,
          channelId: mockChannel.id,
          messageId: mockMessage.id,
          parentMessage: mockMessage,
        },
      });

      const { result } = renderHook(() => useTeams());

      await act(async () => {
        await result.current.sendReply('Reply content');
      });

      expect(mockReplyToMessage).toHaveBeenCalledWith(
        mockTeam.id,
        mockChannel.id,
        mockMessage.id,
        'Reply content'
      );
    });

    it('should not send reply when thread is closed', async () => {
      useAppStore.setState({
        isAuthenticated: true,
        thread: { isOpen: false },
      });

      const { result } = renderHook(() => useTeams());

      await act(async () => {
        await result.current.sendReply('Reply');
      });

      expect(mockReplyToMessage).not.toHaveBeenCalled();
    });

    it('should handle reply error', async () => {
      mockReplyToMessage.mockRejectedValue(new Error('Reply failed'));
      useAppStore.setState({
        isAuthenticated: true,
        thread: {
          isOpen: true,
          teamId: mockTeam.id,
          channelId: mockChannel.id,
          messageId: mockMessage.id,
          parentMessage: mockMessage,
        },
      });

      const { result } = renderHook(() => useTeams());

      await expect(async () => {
        await act(async () => {
          await result.current.sendReply('Reply');
        });
      }).rejects.toThrow('Reply failed');
    });
  });

  describe('closeThread', () => {
    it('should close the thread', async () => {
      useAppStore.setState({
        isAuthenticated: true,
        thread: {
          isOpen: true,
          teamId: mockTeam.id,
          channelId: mockChannel.id,
          messageId: mockMessage.id,
        },
      });

      const { result } = renderHook(() => useTeams());

      act(() => {
        result.current.closeThread();
      });

      expect(result.current.thread.isOpen).toBe(false);
    });
  });

  describe('toggleTeamExpanded', () => {
    it('should toggle team expanded state', async () => {
      useAppStore.setState({
        isAuthenticated: false, // Prevent auto-load
        teams: [{ ...mockTeam, channels: [mockChannel], isExpanded: true }],
      });

      const { result } = renderHook(() => useTeams());

      act(() => {
        result.current.toggleTeamExpanded(mockTeam.id);
      });

      expect(result.current.teams[0].isExpanded).toBe(false);
    });
  });

  describe('selectChannel', () => {
    it('should set selected item to channel', async () => {
      const { result } = renderHook(() => useTeams());

      await act(async () => {
        await result.current.selectChannel(mockTeam.id, mockChannel.id, 'General');
      });

      expect(result.current.selectedItem).toEqual({
        type: 'channel',
        teamId: mockTeam.id,
        channelId: mockChannel.id,
        name: 'General',
      });

      expect(mockGetChannelMessages).toHaveBeenCalledWith(mockTeam.id, mockChannel.id);
    });

    it('should handle channel messages error', async () => {
      mockGetChannelMessages.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useTeams());

      await act(async () => {
        await result.current.selectChannel(mockTeam.id, mockChannel.id, 'General');
      });

      // Should clear messages on error
      expect(result.current.messages).toEqual([]);
    });
  });

  describe('selectChat', () => {
    it('should set selected item to chat', async () => {
      const { result } = renderHook(() => useTeams());

      await act(async () => {
        await result.current.selectChat(mockChat.id, 'Test Chat');
      });

      expect(result.current.selectedItem).toEqual({
        type: 'chat',
        chatId: mockChat.id,
        name: 'Test Chat',
      });

      expect(mockGetChatMessages).toHaveBeenCalledWith(mockChat.id);
    });
  });

  describe('refresh functions', () => {
    it('should expose refreshTeams function', async () => {
      const { result } = renderHook(() => useTeams());

      expect(result.current.refreshTeams).toBeDefined();
      expect(typeof result.current.refreshTeams).toBe('function');
    });

    it('should expose refreshChats function', async () => {
      const { result } = renderHook(() => useTeams());

      expect(result.current.refreshChats).toBeDefined();
      expect(typeof result.current.refreshChats).toBe('function');
    });
  });

  describe('return values', () => {
    it('should return all expected properties', () => {
      const { result } = renderHook(() => useTeams());

      expect(result.current).toHaveProperty('teams');
      expect(result.current).toHaveProperty('teamsLoading');
      expect(result.current).toHaveProperty('selectedItem');
      expect(result.current).toHaveProperty('messages');
      expect(result.current).toHaveProperty('messagesLoading');
      expect(result.current).toHaveProperty('chats');
      expect(result.current).toHaveProperty('chatsLoading');
      expect(result.current).toHaveProperty('thread');
      expect(result.current).toHaveProperty('toggleTeamExpanded');
      expect(result.current).toHaveProperty('selectChannel');
      expect(result.current).toHaveProperty('selectChat');
      expect(result.current).toHaveProperty('sendMessage');
      expect(result.current).toHaveProperty('openMessageThread');
      expect(result.current).toHaveProperty('closeThread');
      expect(result.current).toHaveProperty('sendReply');
      expect(result.current).toHaveProperty('refreshTeams');
      expect(result.current).toHaveProperty('refreshChats');
    });
  });
});
