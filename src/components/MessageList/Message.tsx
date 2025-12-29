import { useState, memo } from 'react';
import { Avatar } from '../UserPresence/Avatar';
import { usePresence } from '../../hooks';
import { stripHtml } from '../../utils';
import type { ChatMessage } from '../../types';

interface MessageProps {
  message: ChatMessage;
  showHeader: boolean;
  onOpenThread?: (messageId: string) => void;
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export const Message = memo(function Message({ message, showHeader, onOpenThread }: MessageProps) {
  const [showActions, setShowActions] = useState(false);
  const { getPresenceForUser } = usePresence();

  const userName = message.from?.user?.displayName || 'Unknown User';
  const userId = message.from?.user?.id;
  const presence = userId ? getPresenceForUser(userId) : undefined;
  const content =
    message.body.contentType === 'html'
      ? stripHtml(message.body.content)
      : message.body.content;

  const replyCount = message.replies?.length || 0;

  return (
    <div
      className={`
        group relative message-hover rounded px-2 py-1
        ${showHeader ? 'mt-4 pt-2' : ''}
      `}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Hover actions */}
      {showActions && (
        <div className="absolute -top-3 right-2 bg-white dark:bg-gray-800 shadow-lg rounded border border-gray-200 dark:border-gray-700 flex">
          <button
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            title="Add reaction"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
          {onOpenThread && (
            <button
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              title="Reply in thread"
              onClick={() => onOpenThread(message.id)}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </button>
          )}
        </div>
      )}

      <div className="flex gap-2">
        {/* Avatar column */}
        <div className="w-9 flex-shrink-0">
          {showHeader && (
            <Avatar
              name={userName}
              size="md"
              showPresence
              presence={presence?.availability}
            />
          )}
        </div>

        {/* Content column */}
        <div className="flex-1 min-w-0">
          {showHeader && (
            <div className="flex items-baseline gap-2 mb-0.5">
              <span className="font-bold text-gray-900 dark:text-white">
                {userName}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatTime(message.createdDateTime)}
              </span>
            </div>
          )}

          <div className="text-gray-800 dark:text-gray-200 break-words">
            {content}
          </div>

          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex gap-1 mt-1">
              {Object.entries(
                message.reactions.reduce(
                  (acc, r) => ({
                    ...acc,
                    [r.reactionType]: (acc[r.reactionType] || 0) + 1,
                  }),
                  {} as Record<string, number>
                )
              ).map(([type, count]) => (
                <span
                  key={type}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-xs"
                >
                  {type} {count}
                </span>
              ))}
            </div>
          )}

          {/* Thread indicator */}
          {replyCount > 0 && onOpenThread && (
            <button
              onClick={() => onOpenThread(message.id)}
              className="mt-1 text-slack-blue hover:underline text-sm"
            >
              {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
});
