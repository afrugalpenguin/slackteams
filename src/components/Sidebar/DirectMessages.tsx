import { useState } from 'react';
import { Avatar } from '../UserPresence/Avatar';
import type { Chat } from '../../types';

interface DirectMessagesProps {
  chats: Chat[];
  loading?: boolean;
  onSelectChat: (chatId: string, chatName: string) => void;
  selectedChatId?: string;
}

function DMSkeleton() {
  return (
    <div className="animate-pulse space-y-2 mt-1">
      {[1, 2, 3].map((i) => (
        <div key={i} className="px-6 py-1.5 flex items-center gap-2">
          <div className="w-6 h-6 bg-white/10 rounded-full" />
          <div className="h-4 bg-white/10 rounded flex-1" />
        </div>
      ))}
    </div>
  );
}

export function DirectMessages({
  chats,
  loading,
  onSelectChat,
  selectedChatId,
}: DirectMessagesProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const getChatDisplayName = (chat: Chat): string => {
    if (chat.topic) return chat.topic;
    if (chat.members && chat.members.length > 0) {
      return chat.members
        .slice(0, 3)
        .map((m) => m.displayName.split(' ')[0])
        .join(', ');
    }
    return 'Chat';
  };

  return (
    <div className="mb-1 mt-4">
      {/* DM header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-1.5 flex items-center gap-2 text-sidebar-muted hover:text-white transition-colors"
      >
        <svg
          className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
            clipRule="evenodd"
          />
        </svg>
        <span className="text-sm font-medium">Direct Messages</span>
      </button>

      {/* Chat list */}
      {isExpanded && (
        <div className="mt-1">
          {loading ? (
            <DMSkeleton />
          ) : chats.length === 0 ? (
            <p className="px-6 py-2 text-sidebar-muted text-sm">No conversations</p>
          ) : (
            chats.map((chat) => {
              const displayName = getChatDisplayName(chat);
              const firstMember = chat.members?.[0];

              return (
                <button
                  key={chat.id}
                  onClick={() => onSelectChat(chat.id, displayName)}
                  className={`
                    channel-item w-full text-left flex items-center gap-2
                    ${
                      selectedChatId === chat.id
                        ? 'active text-white'
                        : 'text-sidebar-muted hover:text-white'
                    }
                  `}
                >
                  <Avatar
                    name={firstMember?.displayName || displayName}
                    size="sm"
                  />
                  <span className="text-sm truncate flex-1">{displayName}</span>
                  {chat.chatType === 'group' && (
                    <span className="text-xs text-sidebar-muted">
                      {chat.members?.length || 0}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
