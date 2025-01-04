import axios from 'axios';

// Define interfaces for API responses
interface ConflictZoneData {
  id: string;
  date: string;
  type: string;
  location: string;
  description?: string;
  source: string;
}

// Utility function for validating API responses
const validateResponse = (data: any): boolean => {
  return Array.isArray(data); // Basic validation; can be extended as needed
};

/**
 * Fetch conflict data from the ACLED API.
 * ACLED provides data on political violence and protest events worldwide.
 */
export const fetchACLEDConflictZones = async (): Promise<ConflictZoneData[]> => {
  try {
    const apiKey = process.env.ACLED_API_KEY; // Use environment variable for API key
    const response = await axios.get(
      `https://api.acleddata.com/acled/read?key=${apiKey}`
    );
    if (!validateResponse(response.data)) {
      throw new Error('Invalid ACLED response format');
    }
    return response.data.map((item: any) => ({
      id: item.event_id,
      date: item.event_date,
      type: item.event_type,
      location: item.location,
      description: item.notes,
      source: 'ACLED',
    }));
  } catch (error) {
    console.error('Error fetching ACLED data:', error);
    return [];
  }
};

/**
 * Fetch conflict data from the UCDP API.
 * UCDP offers data on organized violence and armed conflicts globally.
 */
export const fetchUCDPConflictZones = async (): Promise<ConflictZoneData[]> => {
  try {
    const response = await axios.get('https://ucdp.uu.se/api/v2/conflicts');
    if (!validateResponse(response.data)) {
      throw new Error('Invalid UCDP response format');
    }
    return response.data.map((item: any) => ({
      id: item.id,
      date: item.date_start,
      type: item.type_of_conflict,
      location: item.location,
      description: item.description,
      source: 'UCDP',
    }));
  } catch (error) {
    console.error('Error fetching UCDP data:', error);
    return [];
  }
};

/**
 * Fetch conflict zone data from the Humanitarian OpenStreetMap Team (HOT).
 */
export const fetchHOTConflictZones = async (): Promise<ConflictZoneData[]> => {
  try {
    const response = await axios.get('https://tasks.hotosm.org/api/v1/projects');
    if (!validateResponse(response.data)) {
      throw new Error('Invalid HOT response format');
    }
    return response.data.map((item: any) => ({
      id: item.id,
      date: item.created,
      type: 'Crisis Mapping',
      location: item.geometry,
      description: item.name,
      source: 'HOT',
    }));
  } catch (error) {
    console.error('Error fetching HOT data:', error);
    return [];
  }
};

/**
 * Fetch conflict data from the ConflictZone API.
 */
export const fetchConflictZoneAPI = async (): Promise<ConflictZoneData[]> => {
  try {
    const response = await axios.get('https://conflictzoneapi.example.com/api/v1/incidents');
    if (!validateResponse(response.data)) {
      throw new Error('Invalid ConflictZone API response format');
    }
    return response.data.map((item: any) => ({
      id: item.incident_id,
      date: item.incident_date,
      type: item.incident_type,
      location: item.location,
      description: item.details,
      source: 'ConflictZoneAPI',
    }));
  } catch (error) {
    console.error('Error fetching ConflictZone API data:', error);
    return [];
  }
};

/**
 * Fetch and aggregate data from multiple conflict zone sources.
 * Combines results from ACLED, UCDP, HOT, and ConflictZone API.
 */
export const fetchAllConflictZones = async (): Promise<ConflictZoneData[]> => {
  try {
    const results = await Promise.allSettled([
      fetchACLEDConflictZones(),
      fetchUCDPConflictZones(),
      fetchHOTConflictZones(),
      fetchConflictZoneAPI(),
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