/**
 * Discord Integration Types
 * Follows Starcom type system patterns
 */

// Main server statistics interface
export interface DiscordServerStats {
  id: string;
  name: string;
  instant_invite: string;
  channels: DiscordChannel[];
  members: DiscordMember[];
  presence_count: number;
}

// Member information
export interface DiscordMember {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  avatar_url: string;
  nickname?: string;
  roles?: string[];
}

// Channel information
export interface DiscordChannel {
  id: string;
  name: string;
  position: number;
  type?: 'text' | 'voice' | 'category';
}

// Notification event data
export interface DiscordNotificationData {
  type: 'member_join' | 'member_leave' | 'server_boost' | 'high_activity' | 'milestone_reached';
  memberName?: string;
  memberCount?: number;
  onlineCount?: number;
  details?: string;
  timestamp: Date;
}

// Activity metrics for dashboard
export interface DiscordActivityMetrics {
  currentOnline: number;
  peakOnline: number;
  totalMembers: number;
  activeChannels: number;
  recentJoins: number;
  engagementScore: number; // 0-100 based on activity
  lastActivity: Date;
}

// Widget display preferences
export interface DiscordWidgetConfig {
  showMemberCount: boolean;
  showOnlineCount: boolean;
  showMemberAvatars: boolean;
  maxAvatarsDisplay: number;
  refreshInterval: number;
  enableNotifications: boolean;
  notificationTypes: DiscordNotificationData['type'][];
}
