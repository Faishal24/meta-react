import { useCallback, useState } from 'react';

import { resolveClient } from '../client';
import type { MetaAccountClientConfig } from '../client';
import type { ContextResponse } from '../types';

export interface UseContextActionsOptions extends MetaAccountClientConfig {
  onSuccess?: (context: ContextResponse) => void;
}

export interface UseContextActions {
  /** `PATCH /context/phone-number/{phoneNumberId}` — set the active number. */
  switchPhoneNumber: (phoneNumberId: string) => Promise<ContextResponse>;
  /** `PATCH /context/portfolio/{portfolioId}` — activate a portfolio's first number. */
  switchPortfolio: (portfolioId: string) => Promise<ContextResponse>;
  isProcessing: boolean;
  error: unknown;
}

/** Switches the active phone number or portfolio; the target is bound in the URL, so no body is sent. */
export function useContextActions(
  options: UseContextActionsOptions = {},
): UseContextActions {
  const { baseUrl, axios: axiosInstance, onSuccess } = options;

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<unknown>(null);

  const run = useCallback(
    async (path: string): Promise<ContextResponse> => {
      const { instance, url } = resolveClient({ baseUrl, axios: axiosInstance });

      setIsProcessing(true);
      setError(null);

      try {
        const response = await instance.patch<ContextResponse>(url(path));
        onSuccess?.(response.data);

        return response.data;
      } catch (caught: unknown) {
        setError(caught);

        throw caught;
      } finally {
        setIsProcessing(false);
      }
    },
    [baseUrl, axiosInstance, onSuccess],
  );

  return {
    switchPhoneNumber: (phoneNumberId) =>
      run(`context/phone-number/${phoneNumberId}`),
    switchPortfolio: (portfolioId) => run(`context/portfolio/${portfolioId}`),
    isProcessing,
    error,
  };
}
