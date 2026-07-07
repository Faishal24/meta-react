import { act, renderHook, waitFor } from '@testing-library/react';
import axios, { type AxiosInstance } from 'axios';
import { describe, expect, it, vi } from 'vitest';

import { usePhoneNumberActions } from './usePhoneNumberActions';

interface Methods {
  post?: ReturnType<typeof vi.fn>;
  patch?: ReturnType<typeof vi.fn>;
  delete?: ReturnType<typeof vi.fn>;
}

function mockAxios(methods: Methods): AxiosInstance {
  return methods as unknown as AxiosInstance;
}

const updated = {
  data: { id: 34, phone_number_id: '106', status: 'connected' },
};

describe('usePhoneNumberActions', () => {
  it('registers via POST to the lifecycle path and returns the updated resource', async () => {
    const post = vi.fn().mockResolvedValue({ data: updated });
    const onSuccess = vi.fn();
    const instance = mockAxios({ post });
    const { result } = renderHook(() =>
      usePhoneNumberActions({
        phoneNumberId: '106',
        axios: instance,
        onSuccess,
      }),
    );

    let returned;
    await act(async () => {
      returned = await result.current.register();
    });

    expect(post).toHaveBeenCalledWith(
      'api/whatsapp/phone-numbers/106/register',
      undefined,
      undefined,
    );
    expect(returned).toEqual(updated.data);
    expect(onSuccess).toHaveBeenCalledWith(updated.data);
  });

  it('sends the PIN via PATCH', async () => {
    const patch = vi.fn().mockResolvedValue({ data: updated });
    const instance = mockAxios({ patch });
    const { result } = renderHook(() =>
      usePhoneNumberActions({ phoneNumberId: '106', axios: instance }),
    );

    await act(async () => {
      await result.current.updateTwoStepPin({ pin: '123456' });
    });

    expect(patch).toHaveBeenCalledWith(
      'api/whatsapp/phone-numbers/106/two-step-pin',
      { pin: '123456' },
      undefined,
    );
  });

  it('uploads a business-profile photo as multipart via POST with method spoofing', async () => {
    const post = vi.fn().mockResolvedValue({ data: updated });
    const instance = mockAxios({ post });
    const { result } = renderHook(() =>
      usePhoneNumberActions({ phoneNumberId: '106', axios: instance }),
    );

    const photo = new File(['x'], 'logo.png', { type: 'image/png' });
    await act(async () => {
      await result.current.updateBusinessProfile({ about: 'hi', photo });
    });

    const [url, body, config] = post.mock.calls[0];
    expect(url).toBe('api/whatsapp/phone-numbers/106/business-profile');
    expect(body).toBeInstanceOf(FormData);
    expect((body as FormData).get('_method')).toBe('PATCH');
    expect(config).toEqual({
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  });

  it('sends business-profile as JSON PATCH when there is no photo', async () => {
    const patch = vi.fn().mockResolvedValue({ data: updated });
    const instance = mockAxios({ patch });
    const { result } = renderHook(() =>
      usePhoneNumberActions({ phoneNumberId: '106', axios: instance }),
    );

    await act(async () => {
      await result.current.updateBusinessProfile({ about: 'hi', photo: null });
    });

    const [, body] = patch.mock.calls[0];
    expect(body).not.toBeInstanceOf(FormData);
    expect(body).toMatchObject({ about: 'hi' });
  });

  it('toggles identity key check and configures storage via PATCH', async () => {
    const patch = vi.fn().mockResolvedValue({ data: updated });
    const instance = mockAxios({ patch });
    const { result } = renderHook(() =>
      usePhoneNumberActions({ phoneNumberId: '106', axios: instance }),
    );

    await act(async () => {
      await result.current.updateIdentityKeyCheck({ enabled: true });
      await result.current.updateStorage({ status: 'DEFAULT' });
    });

    expect(patch).toHaveBeenCalledWith(
      'api/whatsapp/phone-numbers/106/identity-key-check',
      { enabled: true },
      undefined,
    );
    expect(patch).toHaveBeenCalledWith(
      'api/whatsapp/phone-numbers/106/storage',
      { status: 'DEFAULT' },
      undefined,
    );
  });

  it('populates errors on a 422 and rejects', async () => {
    const error = {
      response: {
        status: 422,
        data: { errors: { pin: ['The pin must be 6 digits.'] } },
      },
    };
    const patch = vi.fn().mockRejectedValue(error);
    vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);
    const instance = mockAxios({ patch });
    const { result } = renderHook(() =>
      usePhoneNumberActions({ phoneNumberId: '106', axios: instance }),
    );

    await act(async () => {
      await expect(result.current.updateTwoStepPin({ pin: '1' })).rejects.toBe(
        error,
      );
    });

    await waitFor(() =>
      expect(result.current.errors).toEqual({
        pin: ['The pin must be 6 digits.'],
      }),
    );
  });
});
