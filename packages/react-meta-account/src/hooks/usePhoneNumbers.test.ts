import { renderHook, waitFor } from '@testing-library/react';
import type {AxiosInstance} from 'axios';
import { describe, expect, it, vi } from 'vitest';

import { usePhoneNumbers } from './usePhoneNumbers';

function mockAxios(get: ReturnType<typeof vi.fn>): AxiosInstance {
  return { get } as unknown as AxiosInstance;
}

const page = {
  data: [
    {
      id: 34,
      phone_number_id: '106',
      display_phone_number: '+62 812',
      status: 'connected',
    },
  ],
  meta: { current_page: 1, last_page: 1, per_page: 15, total: 1 },
};

describe('usePhoneNumbers', () => {
  it('loads phone numbers with pagination', async () => {
    const get = vi.fn().mockResolvedValue({ data: page });
    const { result } = renderHook(() =>
      usePhoneNumbers({ axios: mockAxios(get) }),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.phoneNumbers).toEqual(page.data);
    expect(result.current.pagination).toEqual(page.meta);
    expect(get).toHaveBeenCalledWith(
      'api/whatsapp/phone-numbers',
      expect.objectContaining({ params: { page: 1 } }),
    );
  });

  it('captures the error on failure', async () => {
    const get = vi.fn().mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() =>
      usePhoneNumbers({ axios: mockAxios(get) }),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.phoneNumbers).toEqual([]);
  });
});
