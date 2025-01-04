export async function fetchHistoricalData(time: number): Promise<any[]> {
    return Promise.resolve([
      { lat: 40.7128, lng: -74.006, size: 1, color: 'red', timestamp: time },
    ]);
  }