import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';

import { resolveClient } from '../client';
import type { MetaAccountClientConfig } from '../client';
import type { Paginated, WhatsAppPhoneNumber } from '../types';

export interface UsePhoneNumbersOptions extends MetaAccountClientConfig {
  page?: number;
}

export interface UsePhoneNumbersResult {
  phoneNumbers: WhatsAppPhoneNumber[];
  pagination: Paginated<WhatsAppPhoneNumber>['meta'] | null;
  isLoading: boolean;
  error: unknown;
  refetch: () => void;
}

export function usePhoneNumbers(
  options: UsePhoneNumbersOptions = {},
): UsePhoneNumbersResult {
  const { page = 1, baseUrl, axios: axiosInstance } = options;

  const [phoneNumbers, setPhoneNumbers] = useState<WhatsAppPhoneNumber[]>([]);
  const [pagination, setPagination] = useState<
    Paginated<WhatsAppPhoneNumber>['meta'] | null
  >(null);
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
      .get<Paginated<WhatsAppPhoneNumber>>(url('phone-numbers'), {
        params: { page },
        signal: controller.signal,
      })
      .then((response) => {
        if (controller.signal.aborted) {
          return;
        }

        setPhoneNumbers(response.data.data);
        setPagination(response.data.meta);
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
  }, [page, baseUrl, axiosInstance, reloadToken]);

  return { phoneNumbers, pagination, isLoading, error, refetch };
}
