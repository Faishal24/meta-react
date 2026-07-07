import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';

import { resolveClient, type MetaAccountClientConfig } from '../client';
import { type Paginated, type WhatsAppAccount } from '../types';

export interface UseBusinessAccountsOptions extends MetaAccountClientConfig {
  page?: number;
}

export interface UseBusinessAccountsResult {
  businessAccounts: WhatsAppAccount[];
  pagination: Paginated<WhatsAppAccount>['meta'] | null;
  isLoading: boolean;
  error: unknown;
  refetch: () => void;
}

export function useBusinessAccounts(
  options: UseBusinessAccountsOptions = {},
): UseBusinessAccountsResult {
  const { page = 1, baseUrl, axios: axiosInstance } = options;

  const [businessAccounts, setBusinessAccounts] = useState<
    WhatsAppAccount[]
  >([]);
  const [pagination, setPagination] = useState<
    Paginated<WhatsAppAccount>['meta'] | null
  >(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<unknown>(null);
  const [reloadToken, setReloadToken] = useState<number>(0);

  const refetch = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const { instance, url } = resolveClient({ baseUrl, axios: axiosInstance });

    setIsLoading(true);
    setError(null);

    instance
      .get<Paginated<WhatsAppAccount>>(url('whatsapp-accounts'), {
        params: { page },
        signal: controller.signal,
      })
      .then((response) => {
        if (controller.signal.aborted) {
          return;
        }
        setBusinessAccounts(response.data.data);
        setPagination(response.data.meta);
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
  }, [page, baseUrl, axiosInstance, reloadToken]);

  return { businessAccounts, pagination, isLoading, error, refetch };
}
