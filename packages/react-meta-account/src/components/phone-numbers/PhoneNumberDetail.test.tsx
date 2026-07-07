import { render, screen, waitFor } from '@testing-library/react';
import { type AxiosInstance } from 'axios';
import { describe, expect, it, vi } from 'vitest';

import { PhoneNumberDetail } from './PhoneNumberDetail';

function mockAxios(get: ReturnType<typeof vi.fn>): AxiosInstance {
  return { get } as unknown as AxiosInstance;
}

const number = {
  data: {
    id: 34,
    whatsapp_account_id: 12,
    phone_number_id: '106',
    display_phone_number: '+62 812',
    verified_name: 'Acme Sales',
    name_status: 'APPROVED',
    status: 'connected',
    has_pin: true,
    business_profile: {
      about: 'We ship maps.',
      address: null,
      description: null,
      email: null,
      websites: null,
      vertical: null,
      profile_picture_url: null,
      synced_at: null,
    },
    oba: { status: 'NOT_STARTED' },
  },
};

describe('PhoneNumberDetail', () => {
  it('shows a skeleton then renders the composed detail once loaded', async () => {
    const get = vi.fn().mockResolvedValue({ data: number });
    render(
      <PhoneNumberDetail phoneNumberId="106" verticals={[]} axios={mockAxios(get)} />,
    );

    // Once loaded, the business-profile form + display-name section appear.
    await waitFor(() => expect(screen.getByText('Business info')).toBeTruthy());
    expect(screen.getByText('Display name')).toBeTruthy();
    // Verified name shows in the summary/display-name sections.
    expect(screen.getAllByText('Acme Sales').length).toBeGreaterThan(0);
  });

  it('shows an error when the number fails to load', async () => {
    const get = vi.fn().mockRejectedValue(new Error('404'));
    render(
      <PhoneNumberDetail phoneNumberId="106" verticals={[]} axios={mockAxios(get)} />,
    );

    await waitFor(() =>
      expect(screen.getByText('Failed to load this number.')).toBeTruthy(),
    );
  });
});
