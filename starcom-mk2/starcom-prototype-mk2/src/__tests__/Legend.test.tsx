import { render, screen, fireEvent } from '@testing-library/react';
import Legend from '../components/HUD/Legend/Legend';

describe('Legend', () => {
  it('renders legend items correctly', () => {
    render(
      <Legend
        items={[
          { label: 'Conflict Zone', color: 'red' },
          { label: 'Weather Marker', color: 'blue' },
        ]}
        title="Data Legend"
        collapsible={true}
      />
    );

    expect(screen.getByText('Data Legend')).toBeInTheDocument();
    expect(screen.getByText('Conflict Zone')).toBeInTheDocument();
    expect(screen.getByText('Weather Marker')).toBeInTheDocument();
  });

  it('handles collapsible functionality', () => {
    render(
      <Legend
        items={[
          { label: 'Conflict Zone', color: 'red' },
          { label: 'Weather Marker', color: 'blue' },
        ]}
        collapsible={true}
      />
    );

    const toggleButton = screen.getByLabelText('Collapse Legend');
    fireEvent.click(toggleButton);
    expect(screen.queryByText('Conflict Zone')).not.toBeInTheDocument();
    fireEvent.click(toggleButton);
    expect(screen.getByText('Conflict Zone')).toBeInTheDocument();
  });

  it('renders no items message when items array is empty', () => {
    render(<Legend items={[]} title="Empty Legend" />);

    expect(screen.getByText('Empty Legend')).toBeInTheDocument();
    expect(screen.getByText('No data to display')).toBeInTheDocument();
  });
});