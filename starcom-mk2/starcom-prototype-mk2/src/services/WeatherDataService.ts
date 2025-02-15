import axios from 'axios';
import { getProxiedUrl } from '../utils/ProxyUtils';

interface WeatherData {
  location: string;
  temperature: number;
  description: string;
  windSpeed: number;
  humidity: number;
}

interface WeatherForecastData {
  dateTime: string;
  temperature: number;
  description: string;
  windSpeed: number;
  humidity: number;
}

export const fetchWeatherData = async (lat: number, lng: number): Promise<WeatherData> => {
  try {
    const apiKey = import.meta.env.VITE_OPENWEATHERMAP_API_KEY;
    const response = await axios.get(
      getProxiedUrl(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&appid=${apiKey}`)
    );

    const data = response.data;
    return {
      location: data.name,
      temperature: data.main.temp,
      description: data.weather[0].description,
      windSpeed: data.wind.speed,
      humidity: data.main.humidity,
    };
  } catch (error) {
    if(axios.isAxiosError(error)) {
      console.error('Error fetching weather data:', error.response ? error.response.data : error.message);
    } else{
      console.error('Error fetching weather data:', error);
    }
    throw new Error('Failed to fetch weather data. Please try again later.');
  }
};

export const fetchWeatherForecast = async (lat: number, lng: number): Promise<WeatherForecastData[]> => {
  try {
    const apiKey = import.meta.env.VITE_OPENWEATHERMAP_API_KEY;
    const response = await axios.get(
      getProxiedUrl(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&units=metric&appid=${apiKey}`)
    );

    return response.data.list.map((entry: WeatherForecastEntry) => ({
      dateTime: entry.dt_txt,
      temperature: entry.main.temp,
      description: entry.weather[0].description,
      windSpeed: entry.wind.speed,
      humidity: entry.main.humidity,
    }));
  } catch (error) {
    if(axios.isAxiosError(error)) {
      console.error('Error fetching weather forecast:', error.response ? error.response.data : error.message);
    } else{
      console.error('Error fetching weather forecast:', error);
    }
    throw new Error('Failed to fetch weather forecast. Please try again later.');
  }
};

interface WeatherForecastEntry {
  dt_txt: string;
  main: {
    temp: number;
    humidity: number;
  };
  weather: Array<{ description: string }>;
  wind: { speed: number };
}
