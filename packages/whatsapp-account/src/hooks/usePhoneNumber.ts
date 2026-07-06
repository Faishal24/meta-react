import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';

import { resolveClient, type WhatsAppAccountClientConfig } from '../client';
import { type WhatsAppPhoneNumber } from '../types';

export interface UsePhoneNumberOptions extends WhatsAppAccountClientConfig {
  /** null/undefined keeps the hook idle (no request) — e.g. before a selection. */
  phoneNumberId?: string | null;
}

export interface UsePhoneNumberResult {
  phoneNumber: WhatsAppPhoneNumber | null;
  isLoading: boolean;
  error: unknown;
  refetch: () => void;
}

export function usePhoneNumber(
  options: UsePhoneNumberOptions,
): UsePhoneNumberResult {
  const { phoneNumberId, baseUrl, axios: axiosInstance } = options;

  const [phoneNumber, setPhoneNumber] = useState<WhatsAppPhoneNumber | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<unknown>(null);
  const [reloadToken, setReloadToken] = useState<number>(0);

  const refetch = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  useEffect(() => {
    if (!phoneNumberId) {
      setPhoneNumber(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    const { instance, url } = resolveClient({ baseUrl, axios: axiosInstance });

    setIsLoading(true);
    setError(null);

    instance
      .get<{ data: WhatsAppPhoneNumber }>(
        url(`phone-numbers/${phoneNumberId}`),
        {
          signal: controller.signal,
        },
      )
      .then((response) => {
        if (controller.signal.aborted) {
          return;
        }
        setPhoneNumber(response.data.data);
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
  }, [phoneNumberId, baseUrl, axiosInstance, reloadToken]);

  return { phoneNumber, isLoading, error, refetch };
}
