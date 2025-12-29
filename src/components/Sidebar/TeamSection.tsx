import type { TeamWithChannels } from '../../types';

interface TeamSectionProps {
  team: TeamWithChannels;
  isExpanded: boolean;
  onToggle: () => void;
  onSelectChannel: (channelId: string, channelName: string) => void;
  selectedChannelId?: string;
}

export function TeamSection({
  team,
  isExpanded,
  onToggle,
  onSelectChannel,
  selectedChannelId,
}: TeamSectionProps) {
  return (
    <div className="mb-1">
      {/* Team header */}
      <button
        onClick={onToggle}
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
        <span className="text-sm font-medium truncate">{team.displayName}</span>
      </button>

      {/* Channels */}
      {isExpanded && (
        <div className="mt-1">
          {team.channels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => onSelectChannel(channel.id, channel.displayName)}
              className={`
                channel-item w-full text-left flex items-center gap-2
                ${
                  selectedChannelId === channel.id
                    ? 'active text-white'
                    : 'text-sidebar-muted hover:text-white'
                }
              `}
            >
              <span className="text-sidebar-muted">#</span>
              <span className="text-sm truncate">{channel.displayName}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
