import { useAuth, useTeams } from '../../hooks';
import { useAppStore } from '../../stores/appStore';
import { Avatar } from '../UserPresence/Avatar';
import { TeamSection } from './TeamSection';
import { DirectMessages } from './DirectMessages';

function SidebarSkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-2">
          <div className="h-5 bg-white/10 rounded w-3/4" />
          <div className="ml-4 space-y-1">
            <div className="h-4 bg-white/5 rounded w-2/3" />
            <div className="h-4 bg-white/5 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function Sidebar() {
  const { currentUser, logout, switchAccount } = useAuth();
  const { teams, teamsLoading, selectedItem, toggleTeamExpanded, selectChannel, chats, chatsLoading, selectChat } = useTeams();
  const { sidebarCollapsed, toggleSidebar, darkMode, toggleDarkMode } = useAppStore();

  if (sidebarCollapsed) {
    return (
      <nav className="w-16 bg-sidebar flex flex-col items-center py-4 gap-4" aria-label="Teams navigation (collapsed)">
        <button
          onClick={toggleSidebar}
          className="text-sidebar-muted hover:text-white p-2 rounded focus:outline-none focus:ring-2 focus:ring-white/50"
          aria-label="Expand sidebar"
          aria-expanded="false"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        {teams.map((team) => (
          <button
            key={team.id}
            className="w-10 h-10 bg-sidebar-hover rounded-lg flex items-center justify-center text-white font-bold hover:bg-sidebar-active focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label={`${team.displayName} team`}
            onClick={() => toggleTeamExpanded(team.id)}
          >
            {team.displayName.charAt(0).toUpperCase()}
          </button>
        ))}
      </nav>
    );
  }

  return (
    <nav className="w-64 bg-sidebar flex flex-col h-full" aria-label="Teams navigation">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSidebar}
            className="text-sidebar-muted hover:text-white p-1 rounded focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label="Collapse sidebar"
            aria-expanded="true"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-white font-bold text-lg">SlackTeams</h1>
        </div>
        <button
          onClick={toggleDarkMode}
          className="text-sidebar-muted hover:text-white p-1 rounded focus:outline-none focus:ring-2 focus:ring-white/50"
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin py-2">
        {teamsLoading ? (
          <SidebarSkeleton />
        ) : (
          <>
            {/* Teams and Channels */}
            {teams.map((team) => (
              <TeamSection
                key={team.id}
                team={team}
                isExpanded={team.isExpanded}
                onToggle={() => toggleTeamExpanded(team.id)}
                onSelectChannel={(channelId, channelName) =>
                  selectChannel(team.id, channelId, channelName)
                }
                selectedChannelId={
                  selectedItem?.type === 'channel' && selectedItem.teamId === team.id
                    ? selectedItem.channelId
                    : undefined
                }
              />
            ))}

            {/* Direct Messages */}
            <DirectMessages
              chats={chats}
              loading={chatsLoading}
              onSelectChat={selectChat}
              selectedChatId={
                selectedItem?.type === 'chat' ? selectedItem.chatId : undefined
              }
            />
          </>
        )}
      </div>

      {/* User profile */}
      <div className="p-3 border-t border-white/10" role="region" aria-label="User profile">
        <div className="flex items-center gap-3">
          <Avatar
            name={currentUser?.displayName || 'User'}
            size="md"
            showPresence
            presence="Available"
          />
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">
              {currentUser?.displayName}
            </p>
            <p className="text-sidebar-muted text-xs truncate">
              {currentUser?.mail || currentUser?.userPrincipalName}
            </p>
          </div>
          <button
            onClick={switchAccount}
            className="text-sidebar-muted hover:text-white p-1 rounded focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label="Switch account"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </button>
          <button
            onClick={logout}
            className="text-sidebar-muted hover:text-white p-1 rounded focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label="Sign out"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
}
