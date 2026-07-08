import { act, renderHook } from '@testing-library/react';
import type { AxiosInstance } from 'axios';
import { describe, expect, it, vi } from 'vitest';

import { useContextActions } from './useContextActions';

function mockAxios(patch: ReturnType<typeof vi.fn>): AxiosInstance {
  return { patch } as unknown as AxiosInstance;
}

const context = {
  business_portfolio_id: '102',
  waba_id: '111',
  phone_number_id: '999',
  available_portfolios: [
    { business_portfolio_id: '102', name: 'Acme', verification_status: 'verified' },
  ],
};

describe('useContextActions', () => {
  it('switches the active phone number via PATCH to the path (no body)', async () => {
    const patch = vi.fn().mockResolvedValue({ data: context });
    const onSuccess = vi.fn();
    const { result } = renderHook(() =>
      useContextActions({ axios: mockAxios(patch), onSuccess }),
    );

    let returned;
    await act(async () => {
      returned = await result.current.switchPhoneNumber('999');
    });

    expect(patch).toHaveBeenCalledWith('api/whatsapp/context/phone-number/999');
    expect(returned).toEqual(context);
    expect(onSuccess).toHaveBeenCalledWith(context);
  });

  it('switches the active portfolio via PATCH to the path', async () => {
    const patch = vi.fn().mockResolvedValue({ data: context });
    const { result } = renderHook(() =>
      useContextActions({ axios: mockAxios(patch) }),
    );

    await act(async () => {
      await result.current.switchPortfolio('102');
    });

    expect(patch).toHaveBeenCalledWith('api/whatsapp/context/portfolio/102');
  });

  it('captures the error when a switch fails', async () => {
    const patch = vi.fn().mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() =>
      useContextActions({ axios: mockAxios(patch) }),
    );

    await act(async () => {
      await expect(result.current.switchPhoneNumber('999')).rejects.toThrow(
        'boom',
      );
    });

    expect(result.current.error).toBeInstanceOf(Error);
  });
});
