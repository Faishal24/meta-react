import { renderHook, waitFor } from '@testing-library/react';
import type { AxiosInstance } from 'axios';
import { describe, expect, it, vi } from 'vitest';

import { useContext } from './useContext';

function mockAxios(get: ReturnType<typeof vi.fn>): AxiosInstance {
  return { get } as unknown as AxiosInstance;
}

const context = {
  business_portfolio_id: '102',
  waba_id: '111',
  phone_number_id: '999',
  available_portfolios: [
    { business_portfolio_id: '102', name: 'Acme', verification_status: 'verified' },
  ],
};

describe('useContext', () => {
  it('loads the active context', async () => {
    const get = vi.fn().mockResolvedValue({ data: context });
    const { result } = renderHook(() => useContext({ axios: mockAxios(get) }));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.context).toEqual(context);
    expect(get).toHaveBeenCalledWith('api/whatsapp/context', expect.anything());
  });

  it('captures the error on failure', async () => {
    const get = vi.fn().mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useContext({ axios: mockAxios(get) }));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.context).toBeNull();
  });
});
