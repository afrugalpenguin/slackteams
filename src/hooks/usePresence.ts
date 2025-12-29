import { useCallback, useEffect, useRef } from 'react';
import { useAppStore } from '../stores/appStore';
import { getMultiplePresence, setMyPresence } from '../services/graph';
import { logger } from '../utils';

const PRESENCE_REFRESH_INTERVAL = 30000; // 30 seconds

export function usePresence() {
  const {
    isAuthenticated,
    messages,
    presenceMap,
    setMultiplePresence,
  } = useAppStore();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastUserIds = useRef<string[]>([]);

  const fetchPresence = useCallback(
    async (userIds: string[]) => {
      if (userIds.length === 0) return;

      try {
        const presences = await getMultiplePresence(userIds);
        setMultiplePresence(presences);
      } catch (error) {
        logger.error('Error fetching presence:', error);
      }
    },
    [setMultiplePresence]
  );

  const setStatus = useCallback(
    async (availability: string, activity: string) => {
      try {
        await setMyPresence(availability, activity);
      } catch (error) {
        logger.error('Error setting presence:', error);
      }
    },
    []
  );

  // Extract unique user IDs from messages
  useEffect(() => {
    if (!isAuthenticated) return;

    const userIds = [
      ...new Set(
        messages
          .filter((m) => m.from?.user?.id)
          .map((m) => m.from!.user!.id)
      ),
    ];

    // Only fetch if user IDs changed
    if (JSON.stringify(userIds) !== JSON.stringify(lastUserIds.current)) {
      lastUserIds.current = userIds;
      fetchPresence(userIds);
    }
  }, [isAuthenticated, messages, fetchPresence]);

  // Set up interval for presence refresh
  useEffect(() => {
    if (!isAuthenticated) return;

    intervalRef.current = setInterval(() => {
      if (lastUserIds.current.length > 0) {
        fetchPresence(lastUserIds.current);
      }
    }, PRESENCE_REFRESH_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAuthenticated, fetchPresence]);

  const getPresenceForUser = useCallback(
    (userId: string) => presenceMap[userId],
    [presenceMap]
  );

  return {
    presenceMap,
    getPresenceForUser,
    setStatus,
    refreshPresence: () => fetchPresence(lastUserIds.current),
  };
}
