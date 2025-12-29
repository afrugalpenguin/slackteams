import { create } from 'zustand';
import type {
  User,
  ChatMessage,
  Chat,
  Presence,
  TeamWithChannels,
} from '../types';

interface SelectedChannel {
  type: 'channel';
  teamId: string;
  channelId: string;
  name: string;
}

interface SelectedChat {
  type: 'chat';
  chatId: string;
  name: string;
}

type Selection = SelectedChannel | SelectedChat | null;

interface ThreadState {
  isOpen: boolean;
  teamId?: string;
  channelId?: string;
  messageId?: string;
  parentMessage?: ChatMessage;
}

interface AppState {
  // Auth state
  isAuthenticated: boolean;
  isLoading: boolean;
  currentUser: User | null;
  authError: string | null;

  // Teams and channels
  teams: TeamWithChannels[];
  teamsLoading: boolean;
  selectedItem: Selection;

  // Messages
  messages: ChatMessage[];
  messagesLoading: boolean;

  // Direct messages
  chats: Chat[];
  chatsLoading: boolean;

  // Thread
  thread: ThreadState;

  // Presence
  presenceMap: Record<string, Presence>;

  // UI state
  sidebarCollapsed: boolean;
  darkMode: boolean;

  // Actions
  setAuthenticated: (isAuthenticated: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setCurrentUser: (user: User | null) => void;
  setAuthError: (error: string | null) => void;

  setTeams: (teams: TeamWithChannels[]) => void;
  setTeamsLoading: (loading: boolean) => void;
  toggleTeamExpanded: (teamId: string) => void;
  setSelectedItem: (item: Selection) => void;

  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  setMessagesLoading: (loading: boolean) => void;

  setChats: (chats: Chat[]) => void;
  setChatsLoading: (loading: boolean) => void;

  openThread: (teamId: string, channelId: string, messageId: string, parentMessage: ChatMessage) => void;
  closeThread: () => void;
  addReply: (reply: ChatMessage) => void;

  setPresence: (userId: string, presence: Presence) => void;
  setMultiplePresence: (presences: Presence[]) => void;

  toggleSidebar: () => void;
  toggleDarkMode: () => void;

  reset: () => void;
}

const initialState = {
  isAuthenticated: false,
  isLoading: true,
  currentUser: null,
  authError: null,
  teams: [],
  teamsLoading: false,
  selectedItem: null,
  messages: [],
  messagesLoading: false,
  chats: [],
  chatsLoading: false,
  thread: { isOpen: false },
  presenceMap: {},
  sidebarCollapsed: false,
  darkMode: true,
};

export const useAppStore = create<AppState>((set) => ({
  ...initialState,

  setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  setLoading: (isLoading) => set({ isLoading }),
  setCurrentUser: (currentUser) => set({ currentUser }),
  setAuthError: (authError) => set({ authError }),

  setTeams: (teams) => set({ teams, teamsLoading: false }),
  setTeamsLoading: (teamsLoading) => set({ teamsLoading }),
  toggleTeamExpanded: (teamId) =>
    set((state) => ({
      teams: state.teams.map((team) =>
        team.id === teamId ? { ...team, isExpanded: !team.isExpanded } : team
      ),
    })),
  setSelectedItem: (selectedItem) => set({ selectedItem, messages: [], thread: { isOpen: false } }),

  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  setMessagesLoading: (messagesLoading) => set({ messagesLoading }),

  setChats: (chats) => set({ chats, chatsLoading: false }),
  setChatsLoading: (chatsLoading) => set({ chatsLoading }),

  openThread: (teamId, channelId, messageId, parentMessage) =>
    set({
      thread: {
        isOpen: true,
        teamId,
        channelId,
        messageId,
        parentMessage,
      },
    }),
  closeThread: () => set({ thread: { isOpen: false } }),
  addReply: (reply) =>
    set((state) => {
      if (!state.thread.parentMessage) return state;
      const updatedParent = {
        ...state.thread.parentMessage,
        replies: [...(state.thread.parentMessage.replies || []), reply],
      };
      return {
        thread: { ...state.thread, parentMessage: updatedParent },
        messages: state.messages.map((m) =>
          m.id === state.thread.messageId ? updatedParent : m
        ),
      };
    }),

  setPresence: (userId, presence) =>
    set((state) => ({
      presenceMap: { ...state.presenceMap, [userId]: presence },
    })),
  setMultiplePresence: (presences) =>
    set((state) => ({
      presenceMap: {
        ...state.presenceMap,
        ...Object.fromEntries(presences.map((p) => [p.id, p])),
      },
    })),

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  toggleDarkMode: () =>
    set((state) => {
      const newDarkMode = !state.darkMode;
      if (newDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return { darkMode: newDarkMode };
    }),

  reset: () => set(initialState),
}));
