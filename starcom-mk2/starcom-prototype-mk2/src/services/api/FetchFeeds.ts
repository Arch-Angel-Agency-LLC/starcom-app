import axios from 'axios';

// Fetch Disaster Zones
export const fetchDisasterZones = async (): Promise<any> => {
  const response = await axios.get('https://api.reliefweb.int/v1/disasters');
  console.log('API Response:', response.data); // Log the API response
  return response.data;
};

// Fetch Weather Data
export const fetchWeatherData = async (lat: number, lng: number): Promise<any> => {
  const apiKey = 'bc06cc109a07b9bb729d4298e40657e7';
  const response = await axios.get(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}`
  );
  return response.data;
};

// Fetch Market Trends
export const fetchMarketTrends = async (): Promise<any> => {
  const apiKey = 'NI91CEFYUCEEWGET';
  const response = await axios.get(
    `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=IBM&interval=5min&apikey=${apiKey}`
  );
  return response.data;
};

console.log({ fetchDisasterZones, fetchWeatherData, fetchMarketTrends });