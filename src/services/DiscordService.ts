// Copy exact pattern from existing services
export interface DiscordServerStats {
  id: string;
  name: string;
  instant_invite: string;
  channels: Array<{
    id: string;
    name: string;
    position: number;
  }>;
  members: Array<{
    id: string;
    username: string;
    discriminator: string;
    avatar: string | null;
    status: string;
    avatar_url: string;
  }>;
  presence_count: number;
}

export const DiscordService = {
  async getServerStats(): Promise<DiscordServerStats> {
    try {
      // Discord's widget API - no proxy needed, CORS-enabled
      const response = await fetch('https://discord.com/api/guilds/1145517675389403287/widget.json');
      
      if (!response.ok) {
        throw new Error(`Discord API error: ${response.status} - ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('[DiscordService] Error fetching server stats:', error);
      // Return fallback data to prevent UI breaks
      return {
        id: '1145517675389403287',
        name: 'Starcom Discord',
        instant_invite: 'https://discord.gg/Mea5v8pQmt',
        channels: [],
        members: [],
        presence_count: 0
      };
    }
  },

  // Helper method for quick online count
  async getOnlineCount(): Promise<number> {
    try {
      const stats = await this.getServerStats();
      return stats.presence_count;
    } catch (error) {
      console.error('[DiscordService] Error fetching online count:', error);
      return 0;
    }
  }
};
