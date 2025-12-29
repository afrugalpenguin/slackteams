import { memo } from 'react';
import { PresenceIndicator } from './PresenceIndicator';
import type { PresenceStatus } from '../../types';

interface AvatarProps {
  name: string;
  photo?: string | null;
  size?: 'sm' | 'md' | 'lg';
  showPresence?: boolean;
  presence?: PresenceStatus;
  className?: string;
}

const sizeClasses = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-12 h-12 text-base',
};

const presencePositions = {
  sm: '-bottom-0.5 -right-0.5',
  md: '-bottom-0.5 -right-0.5',
  lg: '-bottom-1 -right-1',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getColorFromName(name: string): string {
  const colors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-amber-500',
    'bg-yellow-500',
    'bg-lime-500',
    'bg-green-500',
    'bg-emerald-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-sky-500',
    'bg-blue-500',
    'bg-indigo-500',
    'bg-violet-500',
    'bg-purple-500',
    'bg-fuchsia-500',
    'bg-pink-500',
  ];

  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

export const Avatar = memo(function Avatar({
  name,
  photo,
  size = 'md',
  showPresence = false,
  presence,
  className = '',
}: AvatarProps) {
  const initials = getInitials(name);
  const bgColor = getColorFromName(name);

  return (
    <div className={`relative inline-block flex-shrink-0 ${className}`}>
      {photo ? (
        <img
          src={photo}
          alt={name}
          className={`${sizeClasses[size]} rounded object-cover`}
        />
      ) : (
        <div
          className={`
            ${sizeClasses[size]} ${bgColor}
            rounded flex items-center justify-center
            text-white font-semibold
          `}
        >
          {initials}
        </div>
      )}
      {showPresence && (
        <PresenceIndicator
          status={presence}
          size={size === 'lg' ? 'md' : 'sm'}
          className={`absolute ${presencePositions[size]}`}
        />
      )}
    </div>
  );
});
