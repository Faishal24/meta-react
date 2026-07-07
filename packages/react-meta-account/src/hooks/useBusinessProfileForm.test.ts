import { act, renderHook, waitFor } from '@testing-library/react';
import { type AxiosInstance } from 'axios';
import { describe, expect, it, vi } from 'vitest';

import { useBusinessProfileForm } from './useBusinessProfileForm';
import { type BusinessProfile } from '../types';

function mockAxios(patch: ReturnType<typeof vi.fn>): AxiosInstance {
  return { patch } as unknown as AxiosInstance;
}

const profile: BusinessProfile = {
  about: 'We ship maps.',
  address: 'Jl. Sudirman 1',
  description: 'Office mapping.',
  email: 'sales@acme.test',
  websites: ['https://acme.test'],
  vertical: 'PROF_SERVICES',
  profile_picture_url: null,
  synced_at: null,
};

function setup(patch = vi.fn().mockResolvedValue({ data: { data: {} } })) {
  const instance = mockAxios(patch);
  const view = renderHook(() =>
    useBusinessProfileForm({ phoneNumberId: '106', profile, axios: instance }),
  );
  return { ...view, patch };
}

describe('useBusinessProfileForm', () => {
  it('seeds fields from the profile', () => {
    const { result } = setup();

    expect(result.current.about).toBe('We ship maps.');
    expect(result.current.email).toBe('sales@acme.test');
    expect(result.current.websites).toEqual(['https://acme.test']);
  });

  it('adds and removes websites, capped at 2', () => {
    const { result } = setup();

    act(() => result.current.addWebsite());
    expect(result.current.websites).toHaveLength(2);

    // Already at the cap — a third add is a no-op.
    act(() => result.current.addWebsite());
    expect(result.current.websites).toHaveLength(2);

    act(() => result.current.removeWebsite(1));
    expect(result.current.websites).toHaveLength(1);
  });

  it('submits a trimmed payload via updateBusinessProfile', async () => {
    const patch = vi.fn().mockResolvedValue({ data: { data: {} } });
    const { result } = setup(patch);

    act(() => result.current.setAbout('Updated'));
    act(() => result.current.addWebsite()); // adds an empty '' website

    await act(async () => {
      await result.current.submit();
    });

    const [url, body] = patch.mock.calls[0];
    expect(url).toBe('api/whatsapp/phone-numbers/106/business-profile');
    expect(body.about).toBe('Updated');
    // Empty website dropped on submit.
    expect(body.websites).toEqual(['https://acme.test']);
  });
});
