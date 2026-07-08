import { render, screen, waitFor } from '@testing-library/react';
import type {AxiosInstance} from 'axios';
import { describe, expect, it, vi } from 'vitest';

import { PhoneNumberManagement } from './PhoneNumberManagement';

function mockAxios(get: ReturnType<typeof vi.fn>): AxiosInstance {
  return { get } as unknown as AxiosInstance;
}

const number = {
  data: {
    id: 34,
    phone_number_id: '106',
    display_phone_number: '+62 812',
    status: 'connected',
    registered: true,
    has_pin: true,
    settings: {
      identity_key_check: true,
      storage: { status: 'DEFAULT' },
    },
  },
};

describe('PhoneNumberManagement', () => {
  it('renders the four management sections once loaded', async () => {
    const get = vi.fn().mockResolvedValue({ data: number });
    render(
      <PhoneNumberManagement phoneNumberId="106" regions={[]} axios={mockAxios(get)} />,
    );

    await waitFor(() => expect(screen.getByText('Two-step PIN')).toBeTruthy());
    expect(screen.getByText('Identity key check')).toBeTruthy();
    expect(screen.getByText('Data storage')).toBeTruthy();
    expect(screen.getByText('Registration')).toBeTruthy();
  });

  it('shows Deregister when the number is registered', async () => {
    const get = vi.fn().mockResolvedValue({ data: number });
    render(
      <PhoneNumberManagement phoneNumberId="106" regions={[]} axios={mockAxios(get)} />,
    );

    expect(
      await screen.findByRole('button', { name: 'Deregister' }),
    ).toBeTruthy();
  });

  it('shows an error when the number fails to load', async () => {
    const get = vi.fn().mockRejectedValue(new Error('404'));
    render(
      <PhoneNumberManagement phoneNumberId="106" regions={[]} axios={mockAxios(get)} />,
    );

    await waitFor(() =>
      expect(screen.getByText('Failed to load this number.')).toBeTruthy(),
    );
  });
});
