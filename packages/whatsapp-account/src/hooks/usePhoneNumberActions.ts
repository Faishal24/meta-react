import { useCallback, useState } from 'react';
import axios from 'axios';

import { resolveClient, type WhatsAppAccountClientConfig } from '../client';
import {
  type ObaApplicationPayload,
  type UpdateBusinessProfilePayload,
  type UpdateDisplayNamePayload,
  type UpdateTwoStepPinPayload,
  type ValidationErrors,
  type WhatsAppPhoneNumber,
} from '../types';

export interface UsePhoneNumberActionsOptions extends WhatsAppAccountClientConfig {
  phoneNumberId: string;
  onSuccess?: (phoneNumber: WhatsAppPhoneNumber) => void;
}

export interface UsePhoneNumberActions {
  register: () => Promise<WhatsAppPhoneNumber>;
  deregister: () => Promise<WhatsAppPhoneNumber>;
  sync: () => Promise<WhatsAppPhoneNumber>;
  updateTwoStepPin: (
    payload: UpdateTwoStepPinPayload,
  ) => Promise<WhatsAppPhoneNumber>;
  updateBusinessProfile: (
    payload: UpdateBusinessProfilePayload,
  ) => Promise<WhatsAppPhoneNumber>;
  updateDisplayName: (
    payload: UpdateDisplayNamePayload,
  ) => Promise<WhatsAppPhoneNumber>;
  applyForOba: (payload: ObaApplicationPayload) => Promise<WhatsAppPhoneNumber>;
  isProcessing: boolean;
  /** Field errors from the last 422; cleared when the next action starts. */
  errors: ValidationErrors | null;
  error: unknown;
}

function toBusinessProfileBody(
  payload: UpdateBusinessProfilePayload,
): FormData | UpdateBusinessProfilePayload {
  if (!(payload.photo instanceof File)) {
    const { photo: _photo, ...rest } = payload;

    return rest;
  }

  const body = new FormData();
  // Laravel treats PATCH multipart via method spoofing.
  body.append('_method', 'PATCH');

  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined) {
      continue;
    }
    if (key === 'photo' && value instanceof File) {
      body.append('photo', value);
    } else if (key === 'websites' && Array.isArray(value)) {
      value.forEach((url, index) => body.append(`websites[${index}]`, url));
    } else if (value === null) {
      body.append(key, '');
    } else {
      body.append(key, String(value));
    }
  }

  return body;
}

export function usePhoneNumberActions(
  options: UsePhoneNumberActionsOptions,
): UsePhoneNumberActions {
  const { phoneNumberId, baseUrl, axios: axiosInstance, onSuccess } = options;

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errors, setErrors] = useState<ValidationErrors | null>(null);
  const [error, setError] = useState<unknown>(null);

  const run = useCallback(
    async (
      method: 'post' | 'patch' | 'delete',
      path: string,
      body?: unknown,
      isMultipart = false,
    ): Promise<WhatsAppPhoneNumber> => {
      const { instance, url } = resolveClient({
        baseUrl,
        axios: axiosInstance,
      });

      setIsProcessing(true);
      setErrors(null);
      setError(null);

      try {
        const config = isMultipart
          ? { headers: { 'Content-Type': 'multipart/form-data' } }
          : undefined;
        const requestUrl = url(`phone-numbers/${phoneNumberId}/${path}`);

        const response =
          method === 'delete'
            ? await instance.delete<{ data: WhatsAppPhoneNumber }>(requestUrl, {
                data: body,
              })
            : await instance[method]<{ data: WhatsAppPhoneNumber }>(
                requestUrl,
                body,
                config,
              );

        const updated = response.data.data;
        onSuccess?.(updated);

        return updated;
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
    [phoneNumberId, baseUrl, axiosInstance, onSuccess],
  );

  return {
    register: () => run('post', 'register'),
    deregister: () => run('post', 'deregister'),
    sync: () => run('post', 'sync'),
    updateTwoStepPin: (payload) => run('patch', 'two-step-pin', payload),
    updateBusinessProfile: (payload) => {
      const body = toBusinessProfileBody(payload);
      const isMultipart = body instanceof FormData;

      return run(
        isMultipart ? 'post' : 'patch',
        'business-profile',
        body,
        isMultipart,
      );
    },
    updateDisplayName: (payload) => run('patch', 'display-name', payload),
    applyForOba: (payload) => run('post', 'oba', payload),
    isProcessing,
    errors,
    error,
  };
}
