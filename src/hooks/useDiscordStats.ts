// Copy exact pattern from useEnterpriseSpaceWeatherData
import { useState, useEffect, useCallback } from 'react';
import { pollerRegistry } from '../services/pollerRegistry';
import { DiscordService, DiscordServerStats } from '../services/DiscordService';
import { DiscordNotifications } from '../utils/discordNotifications';

interface UseDiscordStatsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

interface UseDiscordStats {
  stats: DiscordServerStats | null;
  onlineCount: number;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
}

export const useDiscordStats = (
  options: UseDiscordStatsOptions = {}
): UseDiscordStats => {
  const {
    autoRefresh = true,
    refreshInterval = 30 * 1000, // 30 seconds default (Discord updates frequently)
  } = options;

  const [stats, setStats] = useState<DiscordServerStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔄 Discord: Fetching server stats...');
      const serverStats = await DiscordService.getServerStats();
      
      // Use functional state update to avoid dependency on stats
      setStats(prevStats => {
        // Detect member changes and notify
        if (prevStats && serverStats.presence_count > prevStats.presence_count) {
          const newMembers = serverStats.presence_count - prevStats.presence_count;
          if (newMembers === 1) {
            // Try to identify the new member
            const newMember = serverStats.members.find(m => 
              !prevStats.members.some(existing => existing.id === m.id)
            );
            DiscordNotifications.showMemberJoined(
              newMember?.username || 'An operative',
              serverStats.presence_count
            );
          }
        }

        // Detect high activity (threshold: 50+ online)
        if (serverStats.presence_count >= 50 && (!prevStats || prevStats.presence_count < 50)) {
          DiscordNotifications.showHighActivity(serverStats.presence_count);
        }
        
        return serverStats;
      });
      
      setLastUpdated(new Date());
      console.log('🎉 Discord: Server stats fetch completed successfully', {
        onlineCount: serverStats.presence_count,
        memberCount: serverStats.members.length
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Discord service failed: ${errorMessage}`);
      console.error('Discord stats fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []); // Remove stats dependency to prevent infinite loops

  const refresh = useCallback(async () => {
    await fetchStats(); // Force refresh
  }, [fetchStats]);

  useEffect(() => {
    if (!autoRefresh) {
      pollerRegistry.stop('discord-stats');
      return;
    }

    const handle = pollerRegistry.register('discord-stats', () => fetchStats(), {
      intervalMs: refreshInterval,
      minIntervalMs: refreshInterval,
      jitterMs: 1000,
      immediate: true,
      scope: 'discord',
    });

    return () => handle.stop();
  }, [autoRefresh, refreshInterval, fetchStats]);

  return {
    stats,
    onlineCount: stats?.presence_count ?? 0,
    isLoading,
    error,
    lastUpdated,
    refresh
  };
};
