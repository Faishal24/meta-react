import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';

import { resolveClient } from '../client';
import type { MetaAccountClientConfig } from '../client';
import type { ContextResponse } from '../types';

export type UseContextOptions = MetaAccountClientConfig;

export interface UseContextResult {
  context: ContextResponse | null;
  isLoading: boolean;
  error: unknown;
  refetch: () => void;
}

/** Reads `GET /context` — the active number/WABA/portfolio and switchable portfolios. */
export function useContext(options: UseContextOptions = {}): UseContextResult {
  const { baseUrl, axios: axiosInstance } = options;

  const [context, setContext] = useState<ContextResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<unknown>(null);
  const [reloadToken, setReloadToken] = useState<number>(0);

  const refetch = useCallback(() => {
    setIsLoading(true);
    setReloadToken((token) => token + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const { instance, url } = resolveClient({ baseUrl, axios: axiosInstance });

    instance
      .get<ContextResponse>(url('context'), { signal: controller.signal })
      .then((response) => {
        if (controller.signal.aborted) {
          return;
        }

        setContext(response.data);
        setError(null);
        setIsLoading(false);
      })
      .catch((caught: unknown) => {
        if (axios.isCancel(caught) || controller.signal.aborted) {
          return;
        }

        setError(caught);
        setIsLoading(false);
      });

    return () => controller.abort();
  }, [baseUrl, axiosInstance, reloadToken]);

  return { context, isLoading, error, refetch };
}
