import { render, screen } from '@testing-library/react';
import OrderProgress from './OrderProgress';

test('shows live delivery progress through courier assignment', () => {
  render(<OrderProgress order={{ orderType: 'DELIVERY', status: 'READY', deliveryStatus: 'ASSIGNED' }} />);

  expect(screen.getByRole('progressbar', { name: 'Order progress' }).getAttribute('aria-valuenow')).toBe('57');
  expect(screen.getByText('Courier assigned').closest('li').classList.contains('current')).toBe(true);
});

test('does not show an unassigned delivery job as ready before the kitchen starts', () => {
  render(<OrderProgress order={{ orderType: 'DELIVERY', status: 'NEW', deliveryStatus: 'UNASSIGNED' }} />);

  expect(screen.getByText('Received').closest('li').classList.contains('current')).toBe(true);
  expect(screen.getByRole('progressbar', { name: 'Order progress' }).getAttribute('aria-valuenow')).toBe('0');
});

test('shows cancellation instead of a completed progress rail', () => {
  render(<OrderProgress order={{ orderType: 'DINE_IN', status: 'CANCELLED' }} />);

  expect(screen.getByText('This order was cancelled.')).toBeTruthy();
  expect(screen.queryByRole('progressbar')).toBeNull();
});
