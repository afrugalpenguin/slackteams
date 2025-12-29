import { useTeams } from '../../hooks';
import { MessageList } from '../MessageList/MessageList';
import { MessageInput } from '../MessageInput/MessageInput';
import { ThreadView } from '../ThreadView/ThreadView';

export function MainContent() {
  const {
    selectedItem,
    messages,
    messagesLoading,
    sendMessage,
    openMessageThread,
    thread,
    closeThread,
    sendReply,
  } = useTeams();

  if (!selectedItem) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <svg
            className="w-20 h-20 mx-auto mb-4 opacity-50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
            />
          </svg>
          <h2 className="text-xl font-medium mb-2">Welcome to SlackTeams</h2>
          <p>Select a channel or conversation to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex bg-white dark:bg-gray-900">
      {/* Main message area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Channel/Chat header */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
          {selectedItem.type === 'channel' ? (
            <>
              <span className="text-gray-500 dark:text-gray-400 text-xl">#</span>
              <h2 className="font-bold text-lg text-gray-900 dark:text-white">
                {selectedItem.name}
              </h2>
            </>
          ) : (
            <h2 className="font-bold text-lg text-gray-900 dark:text-white">
              {selectedItem.name}
            </h2>
          )}
        </div>

        {/* Messages */}
        <MessageList
          messages={messages}
          isLoading={messagesLoading}
          onOpenThread={selectedItem.type === 'channel' ? openMessageThread : undefined}
        />

        {/* Input */}
        <MessageInput
          placeholder={`Message ${selectedItem.type === 'channel' ? '#' : ''}${selectedItem.name}`}
          onSend={sendMessage}
        />
      </div>

      {/* Thread panel */}
      {thread.isOpen && thread.parentMessage && (
        <ThreadView
          parentMessage={thread.parentMessage}
          onClose={closeThread}
          onSendReply={sendReply}
        />
      )}
    </div>
  );
}
