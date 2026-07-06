import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';

import { resolveClient, type WhatsAppAccountClientConfig } from '../client';
import {
  isFacebookOrigin,
  launchEmbeddedSignup,
  loadFacebookSdk,
} from '../onboarding/facebookSdk';
import {
  type EmbeddedSignupSession,
  type OnboardingConfig,
  type ValidationErrors,
  type WhatsAppBusinessAccount,
  type WhatsAppPhoneNumber,
} from '../types';

export interface UseOnboardingOptions extends WhatsAppAccountClientConfig {
  onOnboarded?: (businessAccount: WhatsAppBusinessAccount) => void;
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
            signup_type: parsed.type,
            signup_event: parsed.event,
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
        config.business_portfolio_id,
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
            data: WhatsAppBusinessAccount;
          }>(url('onboarding'), {
            code,
            waba_id: session.waba_id,
            phone_number_id: session.phone_number_id,
          });
          onOnboarded?.(response.data.data);
        } else {
          const response = await instance.post<{ data: WhatsAppPhoneNumber }>(
            url('phone-numbers'),
            {
              code,
              waba_id: session.waba_id,
              phone_number_id: session.phone_number_id,
              signup_type: session.signup_type,
              signup_event: session.signup_event,
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
    [config, baseUrl, axiosInstance, onOnboarded, onPhoneNumberAdded],
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
