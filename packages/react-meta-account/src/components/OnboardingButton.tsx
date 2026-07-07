import { type ReactNode } from 'react';
import { Plus } from 'lucide-react';

import { type MetaAccountClientConfig } from '../client';
import { useOnboarding } from '../hooks';
import {
  type WhatsAppAccount,
  type WhatsAppPhoneNumber,
} from '../types';
import { Button } from './ui/button';

export interface OnboardingButtonProps extends MetaAccountClientConfig {
  /**
   * `onboarding` runs first-time signup (creates the WABA + first number);
   * `add-number` adds a subsequent number to an existing WABA.
   */
  mode?: 'onboarding' | 'add-number';
  onOnboarded?: (businessAccount: WhatsAppAccount) => void;
  onPhoneNumberAdded?: (phoneNumber: WhatsAppPhoneNumber) => void;
  children?: ReactNode;
}

export function OnboardingButton({
  mode = 'onboarding',
  onOnboarded,
  onPhoneNumberAdded,
  children,
  ...clientConfig
}: OnboardingButtonProps) {
  const { isReady, isProcessing, launchOnboarding, launchAddPhoneNumber } =
    useOnboarding({ onOnboarded, onPhoneNumberAdded, ...clientConfig });

  const launch = mode === 'add-number' ? launchAddPhoneNumber : launchOnboarding;
  const label = mode === 'add-number' ? 'Add number' : 'Connect WhatsApp';

  return (
    <Button
      variant={mode === 'add-number' ? 'outline' : 'default'}
      disabled={!isReady || isProcessing}
      onClick={() => launch()}
    >
      <Plus className="size-4" />
      {children ?? label}
    </Button>
  );
}
