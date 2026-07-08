import { useState } from 'react';

import type {MetaAccountClientConfig} from '../../client';
import { usePhoneNumberActions } from '../../hooks';
import type {WhatsAppPhoneNumber} from '../../types';
import { Switch } from '../ui/switch';

export interface IdentityKeyCheckFormProps extends MetaAccountClientConfig {
  phoneNumberId: string;
  /** Current identity-key-check state (from settings.identity_key_check). */
  enabled: boolean;
  onSuccess?: (phoneNumber: WhatsAppPhoneNumber) => void;
}

export function IdentityKeyCheckForm({
  phoneNumberId,
  enabled,
  onSuccess,
  ...clientConfig
}: IdentityKeyCheckFormProps) {
  const actions = usePhoneNumberActions({ phoneNumberId, onSuccess, ...clientConfig });
  const [checked, setChecked] = useState(enabled);

  const toggle = (next: boolean) => {
    setChecked(next);
    actions.updateIdentityKeyCheck({ enabled: next }).catch(() => {
      // Revert the optimistic toggle if the request fails.
      setChecked(!next);
    });
  };

  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-sm text-muted-foreground">
        Require identity key verification for end-to-end encrypted messages.
      </p>
      <Switch checked={checked} disabled={actions.isProcessing} onCheckedChange={toggle} />
    </div>
  );
}
