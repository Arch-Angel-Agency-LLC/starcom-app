import axios from 'axios';

// Define the structure of the weather data response
interface WeatherData {
  location: string;
  temperature: number;
  description: string;
  windSpeed: number;
  humidity: number;
  [key: string]: any; // Add other optional fields as needed
}

/**
 * Fetch weather data for a given latitude and longitude using OpenWeatherMap API.
 * @param lat - Latitude of the location.
 * @param lng - Longitude of the location.
 * @returns A promise that resolves to structured weather data.
 */
export const fetchWeatherData = async (lat: number, lng: number): Promise<WeatherData> => {
  try {
    const apiKey = import.meta.env.VITE_OPENWEATHERMAP_API_KEY; // Use environment variable for the API key
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&appid=${apiKey}`
    );

    // Extract and structure the data
    const data = response.data;
    return {
      location: data.name,
      temperature: data.main.temp,
      description: data.weather[0].description,
      windSpeed: data.wind.speed,
      humidity: data.main.humidity,
    };
  } catch (error) {
    console.error('Error fetching weather data:', error);
    throw new Error('Failed to fetch weather data. Please try again later.');
  }
};

/**
 * Fetch 5-day forecast data for a given latitude and longitude using OpenWeatherMap API.
 * @param lat - Latitude of the location.
 * @param lng - Longitude of the location.
 * @returns A promise that resolves to forecast data.
 */
export const fetchWeatherForecast = async (lat: number, lng: number): Promise<any[]> => {
  try {
    const apiKey = import.meta.env.VITE_OPENWEATHERMAP_API_KEY; // Use environment variable for the API key
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&units=metric&appid=${apiKey}`
    );

    // Extract and structure forecast data
    return response.data.list.map((entry: any) => ({
      dateTime: entry.dt_txt,
      temperature: entry.main.temp,
      description: entry.weather[0].description,
      windSpeed: entry.wind.speed,
      humidity: entry.main.humidity,
    }));
  } catch (error) {
    console.error('Error fetching weather forecast:', error);
    throw new Error('Failed to fetch weather forecast. Please try again later.');
  }
};