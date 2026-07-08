import { renderHook, waitFor } from '@testing-library/react';
import type {AxiosInstance} from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as facebookSdk from '../onboarding/facebookSdk';
import { useOnboarding } from './useOnboarding';

function mockAxios(get: ReturnType<typeof vi.fn>): AxiosInstance {
  return { get } as unknown as AxiosInstance;
}

const config = { app_id: '123', configuration_id: '988' };

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useOnboarding', () => {
  it('loads config then becomes ready once the FB SDK resolves', async () => {
    const get = vi.fn().mockResolvedValue({ data: config });
    const loadSpy = vi
      .spyOn(facebookSdk, 'loadFacebookSdk')
      .mockResolvedValue({} as never);

    const { result } = renderHook(() =>
      useOnboarding({ axios: mockAxios(get) }),
    );

    await waitFor(() => expect(result.current.isReady).toBe(true));

    expect(result.current.config).toEqual(config);
    expect(get).toHaveBeenCalledWith(
      'api/whatsapp/onboarding/config',
      expect.anything(),
    );
    expect(loadSpy).toHaveBeenCalledWith('123');
  });

  it('surfaces an error and stays not-ready when config fails', async () => {
    const get = vi.fn().mockRejectedValue(new Error('no config'));
    const { result } = renderHook(() =>
      useOnboarding({ axios: mockAxios(get) }),
    );

    await waitFor(() => expect(result.current.error).toBeInstanceOf(Error));

    expect(result.current.isReady).toBe(false);
    expect(result.current.config).toBeNull();
  });
});
