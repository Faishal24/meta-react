import { useCallback, useEffect, useRef, useState } from 'react';

import { type WhatsAppAccountClientConfig } from '../client';
import {
  type BusinessProfile,
  type UpdateBusinessProfilePayload,
  type WhatsAppPhoneNumber,
} from '../types';
import { usePhoneNumberActions } from './usePhoneNumberActions';

export interface UseBusinessProfileFormOptions extends WhatsAppAccountClientConfig {
  phoneNumberId: string;
  profile: BusinessProfile;
  onSuccess?: (phoneNumber: WhatsAppPhoneNumber) => void;
}

interface FormState {
  about: string;
  address: string;
  description: string;
  email: string;
  vertical: string;
  websites: string[];
  photo: File | null;
}

function toFormState(profile: BusinessProfile): FormState {
  return {
    about: profile.about ?? '',
    address: profile.address ?? '',
    description: profile.description ?? '',
    email: profile.email ?? '',
    vertical: profile.vertical ?? '',
    websites: profile.websites?.length ? profile.websites : [''],
    photo: null,
  };
}

export function useBusinessProfileForm(options: UseBusinessProfileFormOptions) {
  const { phoneNumberId, profile, onSuccess, ...clientConfig } = options;
  const actions = usePhoneNumberActions({ phoneNumberId, onSuccess, ...clientConfig });

  const [state, setState] = useState<FormState>(() => toFormState(profile));
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    profile.profile_picture_url,
  );
  const objectUrlRef = useRef<string | null>(null);

  const revokePreview = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  // Re-seed when the target profile changes (e.g. switching numbers).
  useEffect(() => {
    setState(toFormState(profile));
    revokePreview();
    setPhotoPreview(profile.profile_picture_url);
  }, [profile, revokePreview]);

  useEffect(() => revokePreview, [revokePreview]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const setWebsiteAt = (index: number, value: string) => {
    setState((prev) => ({
      ...prev,
      websites: prev.websites.map((url, i) => (i === index ? value : url)),
    }));
  };

  const addWebsite = () => {
    setState((prev) =>
      prev.websites.length < 2
        ? { ...prev, websites: [...prev.websites, ''] }
        : prev,
    );
  };

  const removeWebsite = (index: number) => {
    setState((prev) => ({
      ...prev,
      websites: prev.websites.filter((_, i) => i !== index),
    }));
  };

  const pickPhoto = (file: File | null) => {
    setField('photo', file);
    revokePreview();

    if (file) {
      objectUrlRef.current = URL.createObjectURL(file);
      setPhotoPreview(objectUrlRef.current);
    } else {
      setPhotoPreview(profile.profile_picture_url);
    }
  };

  const submit = () => {
    const payload: UpdateBusinessProfilePayload = {
      about: state.about,
      address: state.address,
      description: state.description,
      email: state.email,
      vertical: state.vertical || null,
      websites: state.websites.filter((url) => url.trim() !== ''),
      photo: state.photo,
    };

    return actions.updateBusinessProfile(payload);
  };

  return {
    about: state.about,
    setAbout: (value: string) => setField('about', value),
    address: state.address,
    setAddress: (value: string) => setField('address', value),
    description: state.description,
    setDescription: (value: string) => setField('description', value),
    email: state.email,
    setEmail: (value: string) => setField('email', value),
    vertical: state.vertical,
    setVertical: (value: string) => setField('vertical', value),
    websites: state.websites,
    setWebsiteAt,
    addWebsite,
    removeWebsite,
    photoPreview,
    pickPhoto,
    errors: actions.errors,
    isProcessing: actions.isProcessing,
    submit,
  };
}
