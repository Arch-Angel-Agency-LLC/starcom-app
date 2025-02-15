import '../setupTests';
import { render, screen, waitFor } from '@testing-library/react';
import GlobeComponent from '../components/Globe/GlobeComponent';
import * as api from '../services/api/FetchConflictZoneFeeds';

jest.mock('../services/api/FetchConflictZoneFeeds', () => ({
  fetchAllConflictZones: jest.fn(),
}));

describe('GlobeComponent', () => {
  it('renders GlobeComponent and fetches data successfully', async () => {
    (api.fetchAllConflictZones as jest.Mock).mockResolvedValue([{ lat: 10, lng: 20, size: 1, color: 'red' }]);

    render(<GlobeComponent />);

    await waitFor(() => {
      expect(api.fetchAllConflictZones).toHaveBeenCalled();
    });

    expect(screen.getByText('Data Legend')).toBeInTheDocument();
    expect(screen.getByText('Conflict Zone')).toBeInTheDocument(); // Additional check for fetched data
  });

  it('handles API errors gracefully', async () => {
    (api.fetchAllConflictZones as jest.Mock).mockRejectedValue(new Error('Failed to fetch'));

    render(<GlobeComponent />);

    await waitFor(() => {
      expect(api.fetchAllConflictZones).toHaveBeenCalled();
    });

    // You can test for error messages or fallback UI
    expect(screen.getByText('Data Legend')).toBeInTheDocument();
    expect(screen.getByText('Failed to fetch data')).toBeInTheDocument(); // Check for error message
  });
});