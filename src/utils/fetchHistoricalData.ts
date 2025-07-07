export async function fetchHistoricalData(
    time: number
  ): Promise<Array<{ lat: number; lng: number; size: number; color: string; timestamp: number }>> {
    // Replace this placeholder with the actual API call
    return Promise.resolve([
      { lat: 40.7128, lng: -74.006, size: 1, color: 'red', timestamp: time },
    ]);
  }