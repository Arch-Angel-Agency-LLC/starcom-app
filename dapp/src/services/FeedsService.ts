import axios from 'axios';

const PROXY_URL = 'http://localhost:8081/';

export const fetchDisasterZones = async (): Promise<unknown> => {
  const response = await axios.get(`${PROXY_URL}https://api.reliefweb.int/v1/disasters`);
  console.log('API Response:', response.data); // Log the API response
  return response.data;
};

export const fetchWeatherData = async (lat: number, lng: number): Promise<unknown> => {
  const apiKey = 'bc06cc109a07b9bb729d4298e40657e7';
  const response = await axios.get(
    `${PROXY_URL}https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}`
  );
  return response.data;
};

export const fetchMarketTrends = async (): Promise<unknown> => {
  const apiKey = 'NI91CEFYUCEEWGET';
  const response = await axios.get(
    `${PROXY_URL}https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=IBM&interval=5min&apikey=${apiKey}`
  );
  return response.data;
};

console.log({ fetchDisasterZones, fetchWeatherData, fetchMarketTrends });
