import { useEffect, useState } from 'react';

import { type WhatsAppAccountClientConfig } from '../../client';
import { usePhoneNumberActions } from '../../hooks';
import { type WhatsAppPhoneNumber } from '../../types';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { InputError } from '../InputError';

export interface DisplayNameFormProps extends WhatsAppAccountClientConfig {
  phoneNumberId: string;
  verifiedName: string | null;
  nameStatus: string | null;
  /** OBA status; when APPROVED, renames must go through Meta support, so the form locks. */
  obaStatus?: string | null;
  onSuccess?: (phoneNumber: WhatsAppPhoneNumber) => void;
}

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

const NAME_STATUS_VARIANT: Record<string, BadgeVariant> = {
  APPROVED: 'default',
  PENDING_REVIEW: 'secondary',
  DECLINED: 'destructive',
  EXPIRED: 'destructive',
};

export function DisplayNameForm({
  phoneNumberId,
  verifiedName,
  nameStatus,
  obaStatus,
  onSuccess,
  ...clientConfig
}: DisplayNameFormProps) {
  const actions = usePhoneNumberActions({ phoneNumberId, onSuccess, ...clientConfig });
  const [newName, setNewName] = useState('');

  useEffect(() => setNewName(''), [phoneNumberId]);

  const renameDisabled = obaStatus === 'APPROVED';
  const nameError = actions.errors?.new_display_name?.[0];

  const submit = () => {
    actions.updateDisplayName({ new_display_name: newName }).then(() => setNewName(''));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">Current name</p>
          <p className="text-base font-medium">{verifiedName ?? '—'}</p>
        </div>
        {nameStatus && (
          <Badge variant={NAME_STATUS_VARIANT[nameStatus] ?? 'outline'}>
            {nameStatus}
          </Badge>
        )}
      </div>

      {renameDisabled ? (
        <p className="text-sm text-muted-foreground">
          This number is an Official Business Account; renames go through Meta support.
        </p>
      ) : (
        <div className="space-y-2">
          <Label>Request a new display name</Label>
          <div className="flex items-center gap-2">
            <Input
              value={newName}
              maxLength={75}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="New display name"
            />
            <Button
              onClick={submit}
              disabled={actions.isProcessing || newName.trim() === ''}
            >
              Submit
            </Button>
          </div>
          {nameError && <InputError message={nameError} className="mt-0.5" />}
        </div>
      )}
    </div>
  );
}
