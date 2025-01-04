import axios from 'axios';

const BASE_URL = 'https://ucdpapi.pcr.uu.se/api';
const DEFAULT_VERSION = '24.1';

export const fetchUCDPData = async (
  resource: string,
  filters: Record<string, string | number> = {},
  page: number = 1,
  pageSize: number = 100
): Promise<any> => {
  const params = new URLSearchParams({
    ...filters,
    page: page.toString(),
    pagesize: pageSize.toString(),
  });

  try {
    const response = await axios.get(`${BASE_URL}/${resource}/${DEFAULT_VERSION}?${params}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching UCDP ${resource} data:`, error);
    throw error;
  }
};

export const fetchGEDData = async (filters: Record<string, string | number>, page = 1) => {
  const params = new URLSearchParams({ ...filters, page: page.toString() });
  const url = `${BASE_URL}/gedevents/${DEFAULT_VERSION}?${params.toString()}`;

  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching GED data:', error);
    throw error;
  }
};

export const fetchDyadicData = (filters: Record<string, string | number>, page = 1) =>
  fetchUCDPData('dyadic', filters, page);