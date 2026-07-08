import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type {AxiosInstance} from 'axios';
import { describe, expect, it, vi } from 'vitest';

import { useBusinessProfileForm } from '../../hooks';
import type {BusinessProfile} from '../../types';
import { BusinessProfileForm  } from './BusinessProfileForm';
import type {VerticalOption} from './BusinessProfileForm';

const profile: BusinessProfile = {
  about: 'We ship maps.',
  address: 'Jl. Sudirman 1',
  description: 'Office mapping.',
  email: 'sales@acme.test',
  websites: ['https://acme.test'],
  vertical: null,
  profile_picture_url: null,
  synced_at: null,
};

const verticals: VerticalOption[] = [{ value: 'PROF_SERVICES', label: 'Professional Services' }];

// Thin harness so the form component receives a real hook result.
function Harness({ axios }: { axios: AxiosInstance }) {
  const form = useBusinessProfileForm({ phoneNumberId: '106', profile, axios });

  return <BusinessProfileForm form={form} verticals={verticals} />;
}

function mockAxios(patch: ReturnType<typeof vi.fn>): AxiosInstance {
  return { patch } as unknown as AxiosInstance;
}

describe('BusinessProfileForm', () => {
  it('renders the seeded field values', () => {
    render(<Harness axios={mockAxios(vi.fn())} />);

    expect(
      (screen.getByPlaceholderText('Description') as HTMLTextAreaElement).value,
    ).toBe('Office mapping.');
    expect(
      (screen.getByPlaceholderText('Address') as HTMLInputElement).value,
    ).toBe('Jl. Sudirman 1');
  });

  it('adds a website field, capped at 2', () => {
    render(<Harness axios={mockAxios(vi.fn())} />);

    expect(screen.getAllByPlaceholderText('https://example.com')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: /Add website/ }));
    expect(screen.getAllByPlaceholderText('https://example.com')).toHaveLength(2);
    // At the cap the Add button disappears.
    expect(screen.queryByRole('button', { name: /Add website/ })).toBeNull();
  });

  it('saves via updateBusinessProfile', async () => {
    const patch = vi.fn().mockResolvedValue({ data: { data: {} } });
    render(<Harness axios={mockAxios(patch)} />);

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(patch).toHaveBeenCalledWith(
        'api/whatsapp/phone-numbers/106/business-profile',
        expect.objectContaining({ about: 'We ship maps.' }),
        undefined,
      ),
    );
  });
});
