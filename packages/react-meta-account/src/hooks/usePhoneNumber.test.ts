import { renderHook, waitFor } from '@testing-library/react';
import type {AxiosInstance} from 'axios';
import { describe, expect, it, vi } from 'vitest';

import { usePhoneNumber } from './usePhoneNumber';

function mockAxios(get: ReturnType<typeof vi.fn>): AxiosInstance {
  return { get } as unknown as AxiosInstance;
}

const number = {
  data: {
    id: 34,
    phone_number_id: '106',
    display_phone_number: '+62 812',
    status: 'connected',
  },
};

describe('usePhoneNumber', () => {
  it('loads one number by phone_number_id', async () => {
    const get = vi.fn().mockResolvedValue({ data: number });
    const { result } = renderHook(() =>
      usePhoneNumber({ phoneNumberId: '106', axios: mockAxios(get) }),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.phoneNumber).toEqual(number.data);
    expect(get).toHaveBeenCalledWith(
      'api/whatsapp/phone-numbers/106',
      expect.anything(),
    );
  });

  it('stays idle and fires no request when phoneNumberId is null', async () => {
    const get = vi.fn();
    const { result } = renderHook(() =>
      usePhoneNumber({ phoneNumberId: null, axios: mockAxios(get) }),
    );

    expect(result.current.phoneNumber).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(get).not.toHaveBeenCalled();
  });

  it('captures the error on failure', async () => {
    const get = vi.fn().mockRejectedValue(new Error('404'));
    const { result } = renderHook(() =>
      usePhoneNumber({ phoneNumberId: '106', axios: mockAxios(get) }),
    );

    await waitFor(() => expect(result.current.error).toBeInstanceOf(Error));

    expect(result.current.phoneNumber).toBeNull();
  });
});
