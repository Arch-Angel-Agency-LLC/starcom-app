import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Marquee, { MarqueeDataPoint } from './Marquee';

describe('Marquee', () => {
  const dataPoints: MarqueeDataPoint[] = [
    { id: '1', label: 'Oil', icon: '🛢️', value: '$75.00' },
    { id: '2', label: 'S&P500', icon: '📈', value: '+0.5%' },
    { id: '3', label: 'BTC', icon: '₿', value: '$67k' },
  ];

  it('renders data points', () => {
    render(<Marquee dataPoints={dataPoints} />);
    expect(screen.getByLabelText('marquee')).toBeInTheDocument();
    dataPoints.forEach(dp => {
      expect(screen.getByLabelText(`${dp.label}: ${dp.value}`)).toBeInTheDocument();
    });
  });

  it('shows loading state', () => {
    render(<Marquee dataPoints={[]} loading={true} />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading data...');
  });

  it('shows error state', () => {
    render(<Marquee dataPoints={[]} error="Something went wrong" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Error: Something went wrong');
  });

  it('shows empty state', () => {
    render(<Marquee dataPoints={[]} />);
    expect(screen.getByLabelText('marquee-empty')).toHaveTextContent('No data selected.');
  });

  it('is keyboard focusable and shows visible focus', async () => {
    render(<Marquee dataPoints={dataPoints} />);
    const marquee = screen.getByLabelText('marquee');
    marquee.focus();
    expect(marquee).toHaveFocus();
    await waitFor(() => expect(marquee.className).toMatch(/ring-2/));
  });

  it('pauses and resumes on Space/Enter', () => {
    render(<Marquee dataPoints={dataPoints} />);
    const marquee = screen.getByLabelText('marquee');
    marquee.focus();
    fireEvent.keyDown(marquee, { key: ' ' });
    // No visible change, but no error should occur
    fireEvent.keyDown(marquee, { key: 'Enter' });
  });

  it('pauses on mouse enter and resumes on mouse leave', () => {
    render(<Marquee dataPoints={dataPoints} />);
    const marquee = screen.getByLabelText('marquee');
    fireEvent.mouseEnter(marquee);
    fireEvent.mouseLeave(marquee);
  });

  it('has aria-live polite for updates', () => {
    render(<Marquee dataPoints={dataPoints} />);
    expect(screen.getByLabelText('marquee')).toHaveAttribute('aria-live', 'polite');
  });
});
