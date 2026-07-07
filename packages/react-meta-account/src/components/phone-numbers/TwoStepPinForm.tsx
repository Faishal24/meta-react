import { useState } from 'react';

import { type MetaAccountClientConfig } from '../../client';
import { usePhoneNumberActions } from '../../hooks';
import { type WhatsAppPhoneNumber } from '../../types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { InputError } from '../InputError';

export interface TwoStepPinFormProps extends MetaAccountClientConfig {
  phoneNumberId: string;
  /** Whether a PIN is already set (from the number's has_pin), to label the action Set vs Update. */
  hasPin?: boolean;
  onSuccess?: (phoneNumber: WhatsAppPhoneNumber) => void;
}

export function TwoStepPinForm({
  phoneNumberId,
  hasPin = false,
  onSuccess,
  ...clientConfig
}: TwoStepPinFormProps) {
  const actions = usePhoneNumberActions({ phoneNumberId, onSuccess, ...clientConfig });
  const [pin, setPin] = useState('');

  const submit = () => {
    actions.updateTwoStepPin({ pin }).then(() => setPin(''));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 sm:max-w-xs">
        <Input
          value={pin}
          inputMode="numeric"
          maxLength={6}
          placeholder="6-digit PIN"
          onChange={(event) => setPin(event.target.value.replace(/\D/g, ''))}
        />
        <Button disabled={actions.isProcessing || pin.length !== 6} onClick={submit}>
          {hasPin ? 'Update' : 'Set PIN'}
        </Button>
      </div>
      {actions.errors?.pin?.[0] && <InputError message={actions.errors.pin[0]} />}
      <p className="text-xs text-muted-foreground">
        Two-step verification adds a 6-digit PIN required when registering this number.
      </p>
    </div>
  );
}
