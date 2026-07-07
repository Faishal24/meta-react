import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { type AxiosInstance } from 'axios';
import { describe, expect, it, vi } from 'vitest';

import { StorageForm } from './StorageForm';

function mockAxios(patch: ReturnType<typeof vi.fn>): AxiosInstance {
  return { patch } as unknown as AxiosInstance;
}

const regions = [{ value: 'ID', label: 'Indonesia' }];

describe('StorageForm', () => {
  it('locks with a deregister prompt when the number is registered', () => {
    render(
      <StorageForm
        phoneNumberId="106"
        regions={regions}
        isRegistered
        axios={mockAxios(vi.fn())}
      />,
    );

    expect(screen.getByText(/Deregister this number/)).toBeTruthy();
    expect(screen.queryByText('Storage mode')).toBeNull();
  });

  it('submits DEFAULT without extra fields', async () => {
    const patch = vi.fn().mockResolvedValue({ data: { data: {} } });
    render(
      <StorageForm phoneNumberId="106" regions={regions} axios={mockAxios(patch)} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(patch).toHaveBeenCalledWith(
        'api/whatsapp/phone-numbers/106/storage',
        { status: 'DEFAULT' },
        undefined,
      ),
    );
  });

  it('shows the media TTL field and submits it for NO_STORAGE', async () => {
    const patch = vi.fn().mockResolvedValue({ data: { data: {} } });
    render(
      <StorageForm
        phoneNumberId="106"
        status="NO_STORAGE_ENABLED"
        regions={regions}
        axios={mockAxios(patch)}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText('60'), {
      target: { value: '120' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(patch).toHaveBeenCalledWith(
        'api/whatsapp/phone-numbers/106/storage',
        { status: 'NO_STORAGE_ENABLED', default_media_ttl: 120 },
        undefined,
      ),
    );
  });

  it('submits the region for IN_COUNTRY when preset', async () => {
    const patch = vi.fn().mockResolvedValue({ data: { data: {} } });
    render(
      <StorageForm
        phoneNumberId="106"
        status="IN_COUNTRY_STORAGE_ENABLED"
        dataLocalizationRegion="ID"
        regions={regions}
        axios={mockAxios(patch)}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(patch).toHaveBeenCalledWith(
        'api/whatsapp/phone-numbers/106/storage',
        { status: 'IN_COUNTRY_STORAGE_ENABLED', data_localization_region: 'ID' },
        undefined,
      ),
    );
  });
});
