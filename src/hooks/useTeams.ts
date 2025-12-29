import { useCallback, useEffect, useRef } from 'react';
import { useAppStore } from '../stores/appStore';
import {
  getJoinedTeams,
  getTeamChannels,
  getChannelMessages,
  sendChannelMessage,
  getMessageReplies,
  replyToMessage,
  getChats,
  getChatMessages,
  sendChatMessage,
} from '../services/graph';
import type { TeamWithChannels, ChatMessage } from '../types';
import { logger } from '../utils';
import { toast } from '../stores/toastStore';

// Polling interval for new messages (1 second for real-time feel)
const POLLING_INTERVAL = 1000;

export function useTeams() {
  const {
    isAuthenticated,
    teams,
    teamsLoading,
    selectedItem,
    messages,
    messagesLoading,
    chats,
    chatsLoading,
    setTeams,
    setTeamsLoading,
    toggleTeamExpanded,
    setSelectedItem,
    setMessages,
    addMessage,
    setMessagesLoading,
    setChats,
    setChatsLoading,
    thread,
    openThread,
    closeThread,
    addReply,
  } = useAppStore();

  const loadTeams = useCallback(async () => {
    logger.debug('loadTeams called, isAuthenticated:', isAuthenticated);
    if (!isAuthenticated) return;

    setTeamsLoading(true);
    try {
      logger.debug('Fetching joined teams...');
      const joinedTeams = await getJoinedTeams();
      logger.debug('Joined teams:', joinedTeams);

      const teamsWithChannels: TeamWithChannels[] = await Promise.all(
        joinedTeams.map(async (team) => {
          logger.debug('Fetching channels for team:', team.displayName);
          const channels = await getTeamChannels(team.id);
          logger.debug('Channels:', channels);
          return {
            ...team,
            channels,
            isExpanded: true,
          };
        })
      );

      logger.debug('Setting teams:', teamsWithChannels);
      setTeams(teamsWithChannels);
    } catch (error) {
      logger.error('Error loading teams:', error);
      toast.error('Failed to load teams. Please try again.');
      setTeamsLoading(false);
    }
  }, [isAuthenticated, setTeams, setTeamsLoading]);

  const loadChats = useCallback(async () => {
    if (!isAuthenticated) return;

    setChatsLoading(true);
    try {
      const userChats = await getChats();
      setChats(userChats);
    } catch (error) {
      logger.error('Error loading chats:', error);
      toast.error('Failed to load chats. Please try again.');
      setChatsLoading(false);
    }
  }, [isAuthenticated, setChats, setChatsLoading]);

  const selectChannel = useCallback(
    async (teamId: string, channelId: string, channelName: string) => {
      setSelectedItem({ type: 'channel', teamId, channelId, name: channelName });
      setMessagesLoading(true);

      try {
        const channelMessages = await getChannelMessages(teamId, channelId);
        setMessages(channelMessages);
      } catch (error) {
        logger.error('Error loading messages:', error);
        setMessages([]);
      } finally {
        setMessagesLoading(false);
      }
    },
    [setSelectedItem, setMessagesLoading, setMessages]
  );

  const selectChat = useCallback(
    async (chatId: string, chatName: string) => {
      setSelectedItem({ type: 'chat', chatId, name: chatName });
      setMessagesLoading(true);

      try {
        const chatMessages = await getChatMessages(chatId);
        setMessages(chatMessages);
      } catch (error) {
        logger.error('Error loading chat messages:', error);
        setMessages([]);
      } finally {
        setMessagesLoading(false);
      }
    },
    [setSelectedItem, setMessagesLoading, setMessages]
  );

  const sendMessage = useCallback(
    async (content: string) => {
      if (!selectedItem) return;

      try {
        let newMessage;
        if (selectedItem.type === 'channel') {
          newMessage = await sendChannelMessage(
            selectedItem.teamId,
            selectedItem.channelId,
            content
          );
        } else {
          newMessage = await sendChatMessage(selectedItem.chatId, content);
        }
        addMessage(newMessage);
      } catch (error) {
        logger.error('Error sending message:', error);
        toast.error('Failed to send message. Please try again.');
        throw error;
      }
    },
    [selectedItem, addMessage]
  );

  const openMessageThread = useCallback(
    async (messageId: string) => {
      if (!selectedItem || selectedItem.type !== 'channel') return;

      const parentMessage = messages.find((m) => m.id === messageId);
      if (!parentMessage) return;

      try {
        const replies = await getMessageReplies(
          selectedItem.teamId,
          selectedItem.channelId,
          messageId
        );
        const messageWithReplies = { ...parentMessage, replies };
        openThread(
          selectedItem.teamId,
          selectedItem.channelId,
          messageId,
          messageWithReplies
        );
      } catch (error) {
        logger.error('Error loading thread:', error);
      }
    },
    [selectedItem, messages, openThread]
  );

  const sendReply = useCallback(
    async (content: string) => {
      if (!thread.isOpen || !thread.teamId || !thread.channelId || !thread.messageId) {
        return;
      }

      try {
        const reply = await replyToMessage(
          thread.teamId,
          thread.channelId,
          thread.messageId,
          content
        );
        addReply(reply);
      } catch (error) {
        logger.error('Error sending reply:', error);
        toast.error('Failed to send reply. Please try again.');
        throw error;
      }
    },
    [thread, addReply]
  );

  useEffect(() => {
    if (isAuthenticated) {
      loadTeams();
      loadChats();
    }
  }, [isAuthenticated, loadTeams, loadChats]);

  // Polling for new messages
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messagesRef = useRef<ChatMessage[]>(messages);

  // Keep messagesRef in sync
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    // Clear any existing polling
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }

    // Don't poll if no channel/chat is selected or not authenticated
    if (!selectedItem || !isAuthenticated) {
      return;
    }

    const pollMessages = async () => {
      try {
        let newMessages: ChatMessage[];

        if (selectedItem.type === 'channel') {
          newMessages = await getChannelMessages(selectedItem.teamId, selectedItem.channelId);
        } else {
          newMessages = await getChatMessages(selectedItem.chatId);
        }

        // Only update if there are new messages (compare by length and last message id)
        const currentMessages = messagesRef.current;
        const hasNewMessages =
          newMessages.length !== currentMessages.length ||
          (newMessages.length > 0 && currentMessages.length > 0 &&
           newMessages[newMessages.length - 1]?.id !== currentMessages[currentMessages.length - 1]?.id);

        if (hasNewMessages) {
          logger.debug('New messages detected, updating...');
          setMessages(newMessages);
        }
      } catch (error) {
        logger.error('Error polling messages:', error);
        // Don't show toast for polling errors to avoid spam
      }
    };

    // Start polling
    pollingRef.current = setInterval(pollMessages, POLLING_INTERVAL);
    logger.debug('Started message polling');

    // Cleanup on unmount or when selection changes
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
        logger.debug('Stopped message polling');
      }
    };
  }, [selectedItem, isAuthenticated, setMessages]);

  return {
    teams,
    teamsLoading,
    selectedItem,
    messages,
    messagesLoading,
    chats,
    chatsLoading,
    thread,
    toggleTeamExpanded,
    selectChannel,
    selectChat,
    sendMessage,
    openMessageThread,
    closeThread,
    sendReply,
    refreshTeams: loadTeams,
    refreshChats: loadChats,
  };
}
