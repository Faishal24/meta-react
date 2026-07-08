import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';

import { resolveClient  } from '../client';
import type {MetaAccountClientConfig} from '../client';
import type {WhatsAppPhoneNumber} from '../types';

export interface UsePhoneNumberOptions extends MetaAccountClientConfig {
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
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(phoneNumberId));
  const [error, setError] = useState<unknown>(null);
  const [reloadToken, setReloadToken] = useState<number>(0);
  const [seenId, setSeenId] = useState(phoneNumberId);

  const refetch = useCallback(() => {
    setIsLoading(true);
    setReloadToken((token) => token + 1);
  }, []);

  // Reset when the target id changes, computed during render. Going idle
  // (id null) clears the number; a new id shows loading until the fetch lands.
  if (seenId !== phoneNumberId) {
    setSeenId(phoneNumberId);
    setPhoneNumber(null);
    setError(null);
    setIsLoading(Boolean(phoneNumberId));
  }

  useEffect(() => {
    if (!phoneNumberId) {
      return;
    }

    const controller = new AbortController();
    const { instance, url } = resolveClient({ baseUrl, axios: axiosInstance });

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
  }, [phoneNumberId, baseUrl, axiosInstance, reloadToken]);

  return { phoneNumber, isLoading, error, refetch };
}
