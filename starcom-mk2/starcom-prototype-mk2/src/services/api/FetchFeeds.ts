import { ApiService } from './ApiService';

export const fetchFeeds = async (): Promise<any> => {
  const url = 'https://api.example.com/feeds'; // Replace with actual endpoint
  return ApiService.fetchData(url);
};