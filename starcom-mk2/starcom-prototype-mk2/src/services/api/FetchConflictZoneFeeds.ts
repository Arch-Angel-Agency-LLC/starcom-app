import axios from 'axios';
import { getProxiedUrl } from '../../utils/ProxyUtils';
import xml2js from 'xml2js';

const reliefWebApiUrl = import.meta.env.VITE_RELIEF_WEB_API_URL;
const gdacsApiUrl = import.meta.env.VITE_GDACS_API_URL;

interface ConflictZoneData {
  id: string;
  date: string;
  type: string;
  location: string;
  description?: string;
  source: string;
}

const validateResponse = (data: unknown): boolean => {
  return Array.isArray(data);
};

export const fetchACLEDConflictZones = async (): Promise<ConflictZoneData[]> => {
  try {
    const apiKey = import.meta.env.ACLED_API_KEY;
    const response = await axios.get(getProxiedUrl(`https://api.acleddata.com/acled/read?key=${apiKey}`));
    console.log('ACLED Response:', response.data);
    if (!validateResponse(response.data)) {
      throw new Error('Invalid ACLED response format');
    }
    return response.data.map((item: unknown) => {
      const conflictItem = item as {
        event_id: string;
        event_date: string;
        event_type: string;
        location: string;
        notes?: string;
      };
      return {
        id: conflictItem.event_id,
        date: conflictItem.event_date,
        type: conflictItem.event_type,
        location: conflictItem.location,
        description: conflictItem.notes,
        source: 'ACLED',
      };
    });
  } catch (error) {
    console.error('Error fetching ACLED data:', error);
    return [];
  }
};

export const fetchUCDPConflictZones = async (): Promise<ConflictZoneData[]> => {
  try {
    const response = await axios.get(getProxiedUrl('https://ucdp.uu.se/api/v2/conflicts'));
    console.log('UCDP Response:', response.data);
    if (!validateResponse(response.data)) {
      throw new Error('Invalid UCDP response format');
    }
    return response.data.map((item: unknown) => {
      const conflictItem = item as {
        id: string;
        date_start: string;
        type_of_conflict: string;
        location: string;
        description: string;
      };
      return {
        id: conflictItem.id,
        date: conflictItem.date_start,
        type: conflictItem.type_of_conflict,
        location: conflictItem.location,
        description: conflictItem.description,
        source: 'UCDP',
      };
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Error fetching UCDP data:', error.response ? error.response.data : error.message);
    } else {
      console.error('Error fetching UCDP data:', error);
    }
    return [];
  }
};

export const fetchHOTConflictZones = async (): Promise<ConflictZoneData[]> => {
  try {
    const response = await axios.get(getProxiedUrl('https://tasks.hotosm.org/api/v1/projects'));
    console.log('HOT Response:', response.data);
    if (!validateResponse(response.data)) {
      throw new Error('Invalid HOT response format');
    }
    return response.data.map((item: unknown) => {
      const conflictItem = item as {
        id: string;
        created: string;
        geometry: string;
        name: string;
      };
      return {
        id: conflictItem.id,
        date: conflictItem.created,
        type: 'Crisis Mapping',
        location: conflictItem.geometry,
        description: conflictItem.name,
        source: 'HOT',
      };
    });
  } catch (error) {
    console.error('Error fetching HOT data:', error);
    return [];
  }
};

export const fetchReliefWebConflictZones = async (): Promise<ConflictZoneData[]> => {
  try {
    const response = await axios.get(getProxiedUrl(reliefWebApiUrl));
    console.log('ReliefWeb Response:', response.data);
    if (!validateResponse(response.data.data)) {
      throw new Error('Invalid ReliefWeb response format');
    }
    return response.data.data.map((item: unknown) => {
      const conflictItem = item as {
        id: string;
        date: string;
        type: string;
        location: string;
        description?: string;
      };
      return {
        id: conflictItem.id,
        date: conflictItem.date,
        type: conflictItem.type,
        location: conflictItem.location,
        description: conflictItem.description,
        source: 'ReliefWeb',
      };
    });
  } catch (error) {
    console.error('Error fetching ReliefWeb data:', error);
    return [];
  }
};

export const fetchGDACSConflictZones = async (): Promise<ConflictZoneData[]> => {
  try {
    const response = await axios.get(getProxiedUrl(gdacsApiUrl), { responseType: 'text' });
    console.log('GDACS Response:', response.data);
    const parsedData = await xml2js.parseStringPromise(response.data);
    if (!parsedData.rss.channel[0].item) {
      throw new Error('Invalid GDACS response format');
    }
    return parsedData.rss.channel[0].item.map((item: any) => {
      return {
        id: item.guid[0]._,
        date: item.pubDate[0],
        type: item.title[0],
        location: item['gdacs:location'][0],
        description: item.description[0],
        source: 'GDACS',
      };
    });
  } catch (error) {
    console.error('Error fetching GDACS data:', error);
    return [];
  }
};

export const fetchAllConflictZones = async (): Promise<ConflictZoneData[]> => {
  try {
    const results = await Promise.allSettled([
      fetchACLEDConflictZones(),
      fetchUCDPConflictZones(),
      fetchHOTConflictZones(),
      fetchReliefWebConflictZones(),
      fetchGDACSConflictZones(),
    ]);

    const aggregatedData = results
      .filter(result => result.status === 'fulfilled')
      .flatMap(result => (result as PromiseFulfilledResult<ConflictZoneData[]>).value);

    return aggregatedData;
  } catch (error) {
    console.error('Error aggregating conflict zone data:', error);
    return [];
  }
};