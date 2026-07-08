import { render, screen, waitFor } from '@testing-library/react';
import type { AxiosInstance } from 'axios';
import { describe, expect, it, vi } from 'vitest';

import { PortfolioSwitcher } from './PortfolioSwitcher';

const context = {
  business_portfolio_id: '102',
  waba_id: '111',
  phone_number_id: '999',
  available_portfolios: [
    { business_portfolio_id: '102', name: 'Acme', verification_status: 'verified' },
    { business_portfolio_id: '203', name: 'Acme Labs', verification_status: null },
  ],
};

function mockAxios(get: ReturnType<typeof vi.fn>): AxiosInstance {
  return { get, patch: vi.fn() } as unknown as AxiosInstance;
}

describe('PortfolioSwitcher', () => {
  it('shows the active portfolio name once context loads', async () => {
    const get = vi.fn().mockResolvedValue({ data: context });
    render(<PortfolioSwitcher axios={mockAxios(get)} />);

    await waitFor(() => expect(screen.getByText('Acme')).toBeTruthy());
    expect(get).toHaveBeenCalledWith('api/whatsapp/context', expect.anything());
  });

  it('renders nothing when there are no portfolios', async () => {
    const get = vi
      .fn()
      .mockResolvedValue({ data: { ...context, available_portfolios: [] } });
    const { container } = render(<PortfolioSwitcher axios={mockAxios(get)} />);

    await waitFor(() => expect(get).toHaveBeenCalled());
    expect(container.querySelector('button')).toBeNull();
  });
});
