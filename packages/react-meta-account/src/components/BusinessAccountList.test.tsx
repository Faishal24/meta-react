import { fireEvent, render, screen } from '@testing-library/react';
import type {AxiosInstance} from 'axios';
import { describe, expect, it, vi } from 'vitest';

import { BusinessAccountList } from './BusinessAccountList';

function mockAxios(get: ReturnType<typeof vi.fn>): AxiosInstance {
  return { get } as unknown as AxiosInstance;
}

const account = {
  id: 12,
  waba_id: '102290129340398',
  name: 'Acme Sales',
  token_status: 'valid',
  phone_numbers_count: 2,
  account_review_status: 'approved',
  health_status: { can_send_message: 'available' },
};

function withData() {
  return mockAxios(
    vi.fn().mockResolvedValue({ data: { data: [account], meta: {} } }),
  );
}

describe('BusinessAccountList', () => {
  it('renders a row per business account', async () => {
    render(<BusinessAccountList axios={withData()} />);

    expect(await screen.findByText('Acme Sales')).toBeTruthy();
    expect(screen.getByText('102290129340398')).toBeTruthy();
  });

  it('shows the empty state when there are none', async () => {
    const axios = mockAxios(
      vi.fn().mockResolvedValue({ data: { data: [], meta: {} } }),
    );
    render(<BusinessAccountList axios={axios} />);

    expect(await screen.findByText('No business accounts yet.')).toBeTruthy();
  });

  it('shows an error message on failure', async () => {
    const axios = mockAxios(vi.fn().mockRejectedValue(new Error('boom')));
    render(<BusinessAccountList axios={axios} />);

    expect(
      await screen.findByText('Failed to load business accounts.'),
    ).toBeTruthy();
  });

  it('calls onSelect when a row is clicked', async () => {
    const onSelect = vi.fn();
    render(<BusinessAccountList axios={withData()} onSelect={onSelect} />);

    await screen.findByText('Acme Sales');
    fireEvent.click(screen.getByText('Acme Sales'));

    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 12 }));
  });

  it('calls onSync without triggering onSelect', async () => {
    const onSelect = vi.fn();
    const onSync = vi.fn();
    render(
      <BusinessAccountList axios={withData()} onSelect={onSelect} onSync={onSync} />,
    );

    await screen.findByText('Acme Sales');
    fireEvent.click(screen.getByLabelText('Sync Acme Sales'));

    expect(onSync).toHaveBeenCalledWith(expect.objectContaining({ id: 12 }));
    expect(onSelect).not.toHaveBeenCalled();
  });
});
