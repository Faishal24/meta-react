import { useCallback, useState } from 'react';
import axios from 'axios';

import { resolveClient, type MetaAccountClientConfig } from '../client';
import { type WhatsAppAccount } from '../types';

export interface UseWhatsAppAccountActionsOptions
  extends MetaAccountClientConfig {
  /** The `waba_id` all actions target. */
  wabaId: string;
  onSuccess?: (account: WhatsAppAccount) => void;
}

export interface UseWhatsAppAccountActions {
  /** Queue a refresh of the WABA from Meta (name, review status, health). */
  sync: () => Promise<WhatsAppAccount>;
  /** Manually refresh the business token (~60-day extension). */
  refreshToken: () => Promise<WhatsAppAccount>;
  isProcessing: boolean;
  error: unknown;
}

export function useWhatsAppAccountActions(
  options: UseWhatsAppAccountActionsOptions,
): UseWhatsAppAccountActions {
  const { wabaId, baseUrl, axios: axiosInstance, onSuccess } = options;

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<unknown>(null);

  const run = useCallback(
    async (path: string): Promise<WhatsAppAccount> => {
      const { instance, url } = resolveClient({ baseUrl, axios: axiosInstance });

      setIsProcessing(true);
      setError(null);

      try {
        const response = await instance.post<{ data: WhatsAppAccount }>(
          url(`whatsapp-accounts/${wabaId}/${path}`),
        );
        const updated = response.data.data;
        onSuccess?.(updated);

        return updated;
      } catch (caught: unknown) {
        setError(caught);
        throw caught;
      } finally {
        setIsProcessing(false);
      }
    },
    [wabaId, baseUrl, axiosInstance, onSuccess],
  );

  return {
    sync: () => run('sync'),
    refreshToken: () => run('refresh-token'),
    isProcessing,
    error,
  };
}
