import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from './appStore';

describe('appStore', () => {
  beforeEach(() => {
    useAppStore.getState().reset();
  });

  describe('auth state', () => {
    it('should set authenticated state', () => {
      useAppStore.getState().setAuthenticated(true);
      expect(useAppStore.getState().isAuthenticated).toBe(true);
    });

    it('should set loading state', () => {
      useAppStore.getState().setLoading(false);
      expect(useAppStore.getState().isLoading).toBe(false);
    });

    it('should set current user', () => {
      const user = { id: '1', displayName: 'Test User', mail: 'test@example.com', userPrincipalName: 'test@example.com' };
      useAppStore.getState().setCurrentUser(user);
      expect(useAppStore.getState().currentUser).toEqual(user);
    });
  });

  describe('teams state', () => {
    it('should set teams and clear loading', () => {
      useAppStore.getState().setTeamsLoading(true);
      const teams = [
        { id: '1', displayName: 'Team 1', channels: [], isExpanded: false },
      ];

      useAppStore.getState().setTeams(teams);

      expect(useAppStore.getState().teams).toEqual(teams);
      expect(useAppStore.getState().teamsLoading).toBe(false);
    });

    it('should toggle team expanded state', () => {
      const teams = [
        { id: '1', displayName: 'Team 1', channels: [], isExpanded: false },
        { id: '2', displayName: 'Team 2', channels: [], isExpanded: false },
      ];
      useAppStore.getState().setTeams(teams);

      useAppStore.getState().toggleTeamExpanded('1');

      expect(useAppStore.getState().teams[0].isExpanded).toBe(true);
      expect(useAppStore.getState().teams[1].isExpanded).toBe(false);
    });
  });

  describe('messages state', () => {
    it('should set messages', () => {
      const messages = [{ id: '1', body: { content: 'Hello' } }];
      useAppStore.getState().setMessages(messages as never);

      expect(useAppStore.getState().messages).toEqual(messages);
    });

    it('should add a message', () => {
      const message = { id: '1', body: { content: 'Hello' } };
      useAppStore.getState().addMessage(message as never);

      expect(useAppStore.getState().messages).toHaveLength(1);
    });

    it('should set messages loading', () => {
      useAppStore.getState().setMessagesLoading(true);
      expect(useAppStore.getState().messagesLoading).toBe(true);
    });
  });

  describe('selection state', () => {
    it('should set selected channel', () => {
      useAppStore.getState().setSelectedItem({
        type: 'channel',
        teamId: 't1',
        channelId: 'c1',
        name: 'General',
      });

      const selected = useAppStore.getState().selectedItem;
      expect(selected?.type).toBe('channel');
      expect(selected?.name).toBe('General');
    });

    it('should set selected chat', () => {
      useAppStore.getState().setSelectedItem({
        type: 'chat',
        chatId: 'chat1',
        name: 'John Doe',
      });

      const selected = useAppStore.getState().selectedItem;
      expect(selected?.type).toBe('chat');
      expect(selected?.name).toBe('John Doe');
    });

    it('should clear messages and thread when selection changes', () => {
      useAppStore.getState().setMessages([{ id: '1' }] as never);
      useAppStore.getState().openThread('t1', 'c1', 'm1', { id: 'm1' } as never);

      useAppStore.getState().setSelectedItem({
        type: 'channel',
        teamId: 't2',
        channelId: 'c2',
        name: 'Other',
      });

      expect(useAppStore.getState().messages).toHaveLength(0);
      expect(useAppStore.getState().thread.isOpen).toBe(false);
    });
  });

  describe('thread state', () => {
    it('should open thread', () => {
      const parentMessage = { id: 'm1', body: { content: 'Parent' } };
      useAppStore.getState().openThread('t1', 'c1', 'm1', parentMessage as never);

      const thread = useAppStore.getState().thread;
      expect(thread.isOpen).toBe(true);
      expect(thread.teamId).toBe('t1');
      expect(thread.channelId).toBe('c1');
      expect(thread.messageId).toBe('m1');
    });

    it('should close thread', () => {
      useAppStore.getState().openThread('t1', 'c1', 'm1', {} as never);
      useAppStore.getState().closeThread();

      expect(useAppStore.getState().thread.isOpen).toBe(false);
    });

    it('should add reply to thread', () => {
      const parentMessage = { id: 'm1', body: { content: 'Parent' }, replies: [] };
      useAppStore.getState().openThread('t1', 'c1', 'm1', parentMessage as never);

      const reply = { id: 'r1', body: { content: 'Reply' } };
      useAppStore.getState().addReply(reply as never);

      const thread = useAppStore.getState().thread;
      expect(thread.parentMessage?.replies).toHaveLength(1);
    });
  });

  describe('presence state', () => {
    it('should set single presence', () => {
      useAppStore.getState().setPresence('user1', { id: 'user1', availability: 'Available' } as never);

      expect(useAppStore.getState().presenceMap['user1'].availability).toBe('Available');
    });

    it('should set multiple presences', () => {
      useAppStore.getState().setMultiplePresence([
        { id: 'user1', availability: 'Available' },
        { id: 'user2', availability: 'Busy' },
      ] as never);

      expect(useAppStore.getState().presenceMap['user1'].availability).toBe('Available');
      expect(useAppStore.getState().presenceMap['user2'].availability).toBe('Busy');
    });
  });

  describe('UI state', () => {
    it('should toggle sidebar', () => {
      expect(useAppStore.getState().sidebarCollapsed).toBe(false);

      useAppStore.getState().toggleSidebar();
      expect(useAppStore.getState().sidebarCollapsed).toBe(true);

      useAppStore.getState().toggleSidebar();
      expect(useAppStore.getState().sidebarCollapsed).toBe(false);
    });
  });

  describe('reset', () => {
    it('should reset to initial state', () => {
      useAppStore.getState().setAuthenticated(true);
      useAppStore.getState().setTeams([{ id: '1' }] as never);
      useAppStore.getState().setMessages([{ id: '1' }] as never);

      useAppStore.getState().reset();

      expect(useAppStore.getState().isAuthenticated).toBe(false);
      expect(useAppStore.getState().teams).toHaveLength(0);
      expect(useAppStore.getState().messages).toHaveLength(0);
    });
  });
});
