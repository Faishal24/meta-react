import axios from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';

import { resolveClient  } from '../client';
import type {MetaAccountClientConfig} from '../client';
import {
  isFacebookOrigin,
  launchEmbeddedSignup,
  loadFacebookSdk,
} from '../onboarding/facebookSdk';
import type {EmbeddedSignupSession, OnboardingConfig, ValidationErrors, WhatsAppAccount, WhatsAppPhoneNumber} from '../types';

export interface UseOnboardingOptions extends MetaAccountClientConfig {
  /**
   * Pre-fills the signup popup with a business portfolio. The host supplies it
   * (e.g. from the active context) — the config endpoint no longer returns it.
   */
  businessPortfolioId?: string | null;
  onOnboarded?: (businessAccount: WhatsAppAccount) => void;
  onPhoneNumberAdded?: (phoneNumber: WhatsAppPhoneNumber) => void;
}

export interface UseOnboarding {
  config: OnboardingConfig | null;
  isReady: boolean;
  isProcessing: boolean;
  errors: ValidationErrors | null;
  error: unknown;
  launchOnboarding: () => Promise<void>;
  launchAddPhoneNumber: () => Promise<void>;
}

export function useOnboarding(
  options: UseOnboardingOptions = {},
): UseOnboarding {
  const {
    baseUrl,
    axios: axiosInstance,
    businessPortfolioId,
    onOnboarded,
    onPhoneNumberAdded,
  } = options;

  const [config, setConfig] = useState<OnboardingConfig | null>(null);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errors, setErrors] = useState<ValidationErrors | null>(null);
  const [error, setError] = useState<unknown>(null);

  const sessionRef = useRef<EmbeddedSignupSession | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const { instance, url } = resolveClient({ baseUrl, axios: axiosInstance });
    let cancelled = false;

    instance
      .get<OnboardingConfig>(url('onboarding/config'), {
        signal: controller.signal,
      })
      .then((response) => {
        if (cancelled) {
          return;
        }

        setConfig(response.data);

        return loadFacebookSdk(response.data.app_id);
      })
      .then(() => {
        if (!cancelled) {
          setIsReady(true);
        }
      })
      .catch((caught: unknown) => {
        if (axios.isCancel(caught) || cancelled) {
          return;
        }

        setError(caught);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [baseUrl, axiosInstance]);

  // Capture the popup's session info (waba_id, phone_number_id, ...).
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!isFacebookOrigin(event.origin)) {
        return;
      }

      try {
        const parsed = JSON.parse(event.data);

        if (parsed.type === 'WA_EMBEDDED_SIGNUP' && parsed.data) {
          sessionRef.current = {
            waba_id: parsed.data.waba_id,
            phone_number_id: parsed.data.phone_number_id,
            business_id: parsed.data.business_id,
          };
        }
      } catch {
        // Non-JSON messages from other sources are ignored.
      }
    };

    window.addEventListener('message', handleMessage);

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const launch = useCallback(
    async (endpoint: 'onboarding' | 'phone-numbers'): Promise<void> => {
      if (!config || !window.FB) {
        return;
      }

      sessionRef.current = null;
      const code = await launchEmbeddedSignup(
        window.FB,
        config.configuration_id,
        businessPortfolioId,
      );

      // The cast is needed because the `= null` above makes control-flow
      // analysis miss that the async `message` listener repopulates the ref.
      const session = sessionRef.current as EmbeddedSignupSession | null;

      if (!code || session === null) {
        return;
      }

      const { instance, url } = resolveClient({
        baseUrl,
        axios: axiosInstance,
      });
      setIsProcessing(true);
      setErrors(null);
      setError(null);

      try {
        if (endpoint === 'onboarding') {
          const response = await instance.post<{
            data: WhatsAppAccount;
          }>(url('onboarding'), {
            code,
            waba_id: session.waba_id,
            phone_number_id: session.phone_number_id,
            business_id: session.business_id,
          });
          onOnboarded?.(response.data.data);
        } else {
          const response = await instance.post<{ data: WhatsAppPhoneNumber }>(
            url('phone-numbers'),
            {
              code,
              waba_id: session.waba_id,
              phone_number_id: session.phone_number_id,
            },
          );
          onPhoneNumberAdded?.(response.data.data);
        }
      } catch (caught: unknown) {
        if (axios.isAxiosError(caught) && caught.response?.status === 422) {
          setErrors(
            (caught.response.data as { errors?: ValidationErrors }).errors ??
              {},
          );
        } else {
          setError(caught);
        }

        throw caught;
      } finally {
        setIsProcessing(false);
      }
    },
    [
      config,
      baseUrl,
      axiosInstance,
      businessPortfolioId,
      onOnboarded,
      onPhoneNumberAdded,
    ],
  );

  const launchOnboarding = useCallback(() => launch('onboarding'), [launch]);
  const launchAddPhoneNumber = useCallback(
    () => launch('phone-numbers'),
    [launch],
  );

  return {
    config,
    isReady,
    isProcessing,
    errors,
    error,
    launchOnboarding,
    launchAddPhoneNumber,
  };
}
