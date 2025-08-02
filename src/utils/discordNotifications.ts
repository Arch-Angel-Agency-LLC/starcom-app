// Use existing notification system for Discord events
import RealTimeEventSystem from '../services/realTimeEventSystem';

export interface DiscordNotificationData {
  type: 'member_join' | 'member_leave' | 'server_boost' | 'high_activity';
  memberName?: string;
  memberCount?: number;
  details?: string;
}

export const DiscordNotifications = {
  // Use existing event system pattern
  showMemberJoined(memberName: string, totalOnline: number) {
    const eventSystem = RealTimeEventSystem.getInstance();
    eventSystem.emit({
      type: 'UI_SHOW_NOTIFICATION',
      source: 'collaboration', // Uses existing source category
      payload: {
        title: 'Earth Alliance Discord',
        message: `${memberName} joined the command center (${totalOnline} online)`,
        type: 'info',
        duration: 4000,
      },
      priority: 'low', // Uses existing priority system
      timestamp: new Date()
    });
  },

  showHighActivity(onlineCount: number) {
    const eventSystem = RealTimeEventSystem.getInstance();
    eventSystem.emit({
      type: 'UI_SHOW_NOTIFICATION',
      source: 'collaboration',
      payload: {
        title: 'Discord Activity Alert',
        message: `High activity detected: ${onlineCount} operatives online`,
        type: 'success',
        duration: 3000,
      },
      priority: 'normal',
      timestamp: new Date()
    });
  },

  showServerBoost(boosterName: string) {
    const eventSystem = RealTimeEventSystem.getInstance();
    eventSystem.emit({
      type: 'UI_SHOW_NOTIFICATION',
      source: 'collaboration',
      payload: {
        title: 'Server Boost',
        message: `${boosterName} boosted the Earth Alliance server!`,
        type: 'success',
        duration: 6000,
      },
      priority: 'normal',
      timestamp: new Date()
    });
  }
};
