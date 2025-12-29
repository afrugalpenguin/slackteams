import { Message } from '../MessageList/Message';
import { MessageInput } from '../MessageInput/MessageInput';
import type { ChatMessage } from '../../types';

interface ThreadViewProps {
  parentMessage: ChatMessage;
  onClose: () => void;
  onSendReply: (content: string) => Promise<void>;
}

export function ThreadView({ parentMessage, onClose, onSendReply }: ThreadViewProps) {
  const replies = parentMessage.replies || [];

  return (
    <div className="w-96 border-l border-gray-200 dark:border-gray-700 flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-gray-900 dark:text-white">Thread</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Parent message */}
      <div className="p-2 border-b border-gray-200 dark:border-gray-700">
        <Message message={parentMessage} showHeader />
      </div>

      {/* Replies */}
      <div className="flex-1 overflow-y-auto p-2">
        {replies.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            No replies yet. Start the conversation!
          </p>
        ) : (
          <div className="space-y-1">
            {replies.map((reply, index) => {
              const prevReply = replies[index - 1];
              const showHeader =
                !prevReply ||
                prevReply.from?.user?.id !== reply.from?.user?.id ||
                new Date(reply.createdDateTime).getTime() -
                  new Date(prevReply.createdDateTime).getTime() >
                  5 * 60 * 1000;

              return (
                <Message key={reply.id} message={reply} showHeader={showHeader} />
              );
            })}
          </div>
        )}
      </div>

      {/* Reply input */}
      <MessageInput
        placeholder="Reply in thread..."
        onSend={onSendReply}
      />
    </div>
  );
}
