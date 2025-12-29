import { useEffect, useRef, useMemo } from 'react';
import { Message } from './Message';
import type { ChatMessage } from '../../types';

interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onOpenThread?: (messageId: string) => void;
}

export function MessageList({ messages, isLoading, onOpenThread }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Memoize header visibility calculations - must be called before any early returns
  const messagesWithHeaders = useMemo(() => {
    return messages.map((message, index) => {
      const prevMessage = messages[index - 1];
      const showHeader =
        !prevMessage ||
        prevMessage.from?.user?.id !== message.from?.user?.id ||
        new Date(message.createdDateTime).getTime() -
          new Date(prevMessage.createdDateTime).getTime() >
          5 * 60 * 1000; // 5 minutes gap
      return { message, showHeader };
    });
  }, [messages]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <svg
            className="animate-spin h-8 w-8 text-slack-blue"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="text-gray-500 dark:text-gray-400">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <svg
            className="w-16 h-16 mx-auto mb-4 opacity-50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <p className="text-lg font-medium">No messages yet</p>
          <p className="text-sm">Be the first to send a message!</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto px-4 py-2"
      role="log"
      aria-label="Messages"
      aria-live="polite"
    >
      <div className="space-y-1">
        {messagesWithHeaders.map(({ message, showHeader }) => (
          <Message
            key={message.id}
            message={message}
            showHeader={showHeader}
            onOpenThread={onOpenThread}
          />
        ))}
      </div>
      <div ref={bottomRef} />
    </div>
  );
}
