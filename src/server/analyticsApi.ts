// Server-side Google Analytics API handler
// Uses the provided service account credentials to fetch real GA4 data

interface GA4RealtimeResponse {
  activeUsers: number;
  pageViews: number;
  sessionDuration: string;
  bounceRate: string;
  activeUsersChange: string;
  pageViewsChange: string;
  sessionDurationChange: string;
  bounceRateChange: string;
}

class GoogleAnalyticsAPIHandler {
  private propertyId: string = '421757534';
  private serviceAccountCredentials = {
    type: "service_account",
    project_id: "starcom-app",
    private_key_id: "dc2f8b7e15c7e4a9c6b3d8e9f2a1b4c7d6e5f8a9",
    private_key: process.env.GOOGLE_ANALYTICS_PRIVATE_KEY?.replace(/\\n/g, '\n') || "",
    client_email: "starcom-analytics-reader@starcom-app.iam.gserviceaccount.com",
    client_id: "114532847291053628471",
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/starcom-analytics-reader%40starcom-app.iam.gserviceaccount.com",
    universe_domain: "googleapis.com"
  };

  // Get OAuth access token using service account credentials
  async getAccessToken(): Promise<string> {
    try {
      const jwt = await this.createJWT();
      
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: jwt
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`OAuth error: ${data.error_description || data.error}`);
      }

      return data.access_token;
    } catch (error) {
      console.error('Failed to get access token:', error);
      throw error;
    }
  }

  // Create JWT for service account authentication
  private async createJWT(): Promise<string> {
    // This is a simplified JWT creation - in production you'd use a proper JWT library
    // For now, throw an error to indicate server-side implementation needed
    throw new Error('JWT creation requires server-side crypto implementation');
  }

  // Fetch real-time data from Google Analytics Data API
  async fetchRealtimeData(): Promise<GA4RealtimeResponse> {
    try {
      const accessToken = await this.getAccessToken();
      
      // Use Google Analytics Data API v1 to get real-time data
      const response = await fetch(
        `https://analyticsdata.googleapis.com/v1beta/properties/${this.propertyId}:runRealtimeReport`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            dimensions: [
              { name: 'country' },
              { name: 'city' }
            ],
            metrics: [
              { name: 'activeUsers' },
              { name: 'screenPageViews' },
              { name: 'averageSessionDuration' },
              { name: 'bounceRate' }
            ]
          })
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`GA4 API error: ${data.error?.message || 'Unknown error'}`);
      }

      return this.processGA4Response(data);
    } catch (error) {
      console.error('Failed to fetch GA4 real-time data:', error);
      throw error;
    }
  }

  // Process GA4 API response into our format
  private processGA4Response(data: any): GA4RealtimeResponse {
    // Extract metrics from GA4 response
    const rows = data.rows || [];
    const totals = data.totals?.[0] || {};
    
    // Calculate totals from the response
    let totalActiveUsers = 0;
    let totalPageViews = 0;
    let totalSessionDuration = 0;
    let totalBounceRate = 0;

    if (totals.metricValues) {
      totalActiveUsers = parseInt(totals.metricValues[0]?.value || '0');
      totalPageViews = parseInt(totals.metricValues[1]?.value || '0');
      totalSessionDuration = parseFloat(totals.metricValues[2]?.value || '0');
      totalBounceRate = parseFloat(totals.metricValues[3]?.value || '0');
    }

    return {
      activeUsers: totalActiveUsers,
      pageViews: totalPageViews,
      sessionDuration: `${Math.round(totalSessionDuration / 60)}m`,
      bounceRate: `${Math.round(totalBounceRate * 100)}%`,
      activeUsersChange: '+0%', // Would need historical data for comparison
      pageViewsChange: '+0%',
      sessionDurationChange: '+0%',
      bounceRateChange: '+0%'
    };
  }
}

export const analyticsAPIHandler = new GoogleAnalyticsAPIHandler();
