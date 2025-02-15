import { fetchUCDPData } from '../services/api/UCDPApi';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

const mock = new MockAdapter(axios);

describe('fetchUCDPData', () => {
  it('fetches data successfully', async () => {
    const mockResponse = { data: [{ id: 1, name: 'Conflict 1' }] };
    mock.onGet('https://ucdpapi.pcr.uu.se/api/resource/24.1?page=1&pagesize=100').reply(200, mockResponse);

    const result = await fetchUCDPData('resource');
    expect(result).toEqual(mockResponse.data);
  });

  it('throws an error on failure', async () => {
    mock.onGet('https://ucdpapi.pcr.uu.se/api/resource/24.1?page=1&pagesize=100').reply(500);

    await expect(fetchUCDPData('resource')).rejects.toThrow('Request failed with status code 500');
  });
});