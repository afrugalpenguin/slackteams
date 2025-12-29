import type { PresenceStatus } from '../../types';

interface PresenceIndicatorProps {
  status?: PresenceStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const statusColors: Record<PresenceStatus, string> = {
  Available: 'bg-presence-online',
  Away: 'bg-presence-away',
  BeRightBack: 'bg-presence-away',
  Busy: 'bg-presence-dnd',
  DoNotDisturb: 'bg-presence-dnd',
  Offline: 'bg-presence-offline',
  PresenceUnknown: 'bg-presence-offline',
};

const sizeClasses = {
  sm: 'w-2 h-2',
  md: 'w-3 h-3',
  lg: 'w-4 h-4',
};

export function PresenceIndicator({
  status = 'PresenceUnknown',
  size = 'md',
  className = '',
}: PresenceIndicatorProps) {
  return (
    <span
      className={`
        inline-block rounded-full border-2 border-white dark:border-gray-900
        ${statusColors[status]}
        ${sizeClasses[size]}
        ${className}
      `}
      title={status}
    />
  );
}
