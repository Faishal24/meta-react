import { act, renderHook, waitFor } from '@testing-library/react';
import type {AxiosInstance} from 'axios';
import { describe, expect, it, vi } from 'vitest';

import { useBusinessAccounts } from './useBusinessAccounts';

function mockAxios(get: ReturnType<typeof vi.fn>): AxiosInstance {
  return { get } as unknown as AxiosInstance;
}

const page = {
  data: [{ id: 12, waba_id: '102', name: 'Acme', token_status: 'valid' }],
  meta: { current_page: 1, last_page: 1, per_page: 15, total: 1 },
};

describe('useBusinessAccounts', () => {
  it('loads and exposes business accounts with pagination', async () => {
    const get = vi.fn().mockResolvedValue({ data: page });
    const { result } = renderHook(() =>
      useBusinessAccounts({ axios: mockAxios(get) }),
    );

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.businessAccounts).toEqual(page.data);
    expect(result.current.pagination).toEqual(page.meta);
    expect(result.current.error).toBeNull();
    expect(get).toHaveBeenCalledWith(
      'api/whatsapp/whatsapp-accounts',
      expect.objectContaining({ params: { page: 1 } }),
    );
  });

  it('requests the given page and honors a custom baseUrl', async () => {
    const get = vi.fn().mockResolvedValue({ data: page });
    renderHook(() =>
      useBusinessAccounts({
        page: 3,
        baseUrl: 'api/v2/wa',
        axios: mockAxios(get),
      }),
    );

    await waitFor(() =>
      expect(get).toHaveBeenCalledWith(
        'api/v2/wa/whatsapp-accounts',
        expect.objectContaining({ params: { page: 3 } }),
      ),
    );
  });

  it('captures the error on failure', async () => {
    const failure = new Error('network down');
    const get = vi.fn().mockRejectedValue(failure);
    const { result } = renderHook(() =>
      useBusinessAccounts({ axios: mockAxios(get) }),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBe(failure);
    expect(result.current.businessAccounts).toEqual([]);
  });

  it('refetches when refetch is called', async () => {
    const get = vi.fn().mockResolvedValue({ data: page });
    // Stable instance across renders, mirroring a host-owned axios instance;
    // an inline instance would be a new object each render and re-fire the effect.
    const instance = mockAxios(get);
    const { result } = renderHook(() =>
      useBusinessAccounts({ axios: instance }),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(get).toHaveBeenCalledTimes(1);

    act(() => result.current.refetch());

    await waitFor(() => expect(get).toHaveBeenCalledTimes(2));
  });
});
