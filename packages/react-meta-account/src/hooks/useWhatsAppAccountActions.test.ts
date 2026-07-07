import { act, renderHook } from '@testing-library/react';
import { type AxiosInstance } from 'axios';
import { describe, expect, it, vi } from 'vitest';

import { useWhatsAppAccountActions } from './useWhatsAppAccountActions';

function mockAxios(post: ReturnType<typeof vi.fn>): AxiosInstance {
  return { post } as unknown as AxiosInstance;
}

const account = { data: { id: 12, waba_id: '102', token_status: 'valid' } };

describe('useWhatsAppAccountActions', () => {
  it('syncs via POST to the WABA path and returns the updated account', async () => {
    const post = vi.fn().mockResolvedValue({ data: account });
    const onSuccess = vi.fn();
    const instance = mockAxios(post);
    const { result } = renderHook(() =>
      useWhatsAppAccountActions({ wabaId: '102', axios: instance, onSuccess }),
    );

    let returned;
    await act(async () => {
      returned = await result.current.sync();
    });

    expect(post).toHaveBeenCalledWith('api/whatsapp/whatsapp-accounts/102/sync');
    expect(returned).toEqual(account.data);
    expect(onSuccess).toHaveBeenCalledWith(account.data);
  });

  it('refreshes the token via POST', async () => {
    const post = vi.fn().mockResolvedValue({ data: account });
    const instance = mockAxios(post);
    const { result } = renderHook(() =>
      useWhatsAppAccountActions({ wabaId: '102', axios: instance }),
    );

    await act(async () => {
      await result.current.refreshToken();
    });

    expect(post).toHaveBeenCalledWith(
      'api/whatsapp/whatsapp-accounts/102/refresh-token',
    );
  });

  it('captures the error on failure', async () => {
    const post = vi.fn().mockRejectedValue(new Error('boom'));
    const instance = mockAxios(post);
    const { result } = renderHook(() =>
      useWhatsAppAccountActions({ wabaId: '102', axios: instance }),
    );

    await act(async () => {
      await expect(result.current.sync()).rejects.toThrow('boom');
    });

    expect(result.current.error).toBeInstanceOf(Error);
  });
});
