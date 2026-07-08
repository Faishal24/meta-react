import { useState } from 'react';

import type {MetaAccountClientConfig} from '../../client';
import { usePhoneNumberActions } from '../../hooks';
import type {DisplayNameInfo, WhatsAppPhoneNumber} from '../../types';
import { InputError } from '../InputError';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

export interface DisplayNameFormProps extends MetaAccountClientConfig {
  phoneNumberId: string;
  verifiedName: string | null;
  nameStatus: string | null;
  /** Pending name, rejection, and rename-quota tracking (from display_name). */
  displayName?: DisplayNameInfo | null;
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

const RENAME_LIMIT = 10;
const WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

/** Count name changes within the rolling 30-day window. */
function recentChangeCount(timestamps: string[]): number {
  const cutoff = Date.now() - WINDOW_MS;

  return timestamps.filter((ts) => new Date(ts).getTime() >= cutoff).length;
}

export function DisplayNameForm({
  phoneNumberId,
  verifiedName,
  nameStatus,
  displayName,
  obaStatus,
  onSuccess,
  ...clientConfig
}: DisplayNameFormProps) {
  const actions = usePhoneNumberActions({ phoneNumberId, onSuccess, ...clientConfig });
  const [newName, setNewName] = useState('');

  // Reset the input when the target number changes, computed during render
  // rather than in an effect (React "adjusting state when a prop changes").
  const [seenId, setSeenId] = useState(phoneNumberId);

  if (seenId !== phoneNumberId) {
    setSeenId(phoneNumberId);
    setNewName('');
  }

  const renameDisabled = obaStatus === 'APPROVED';
  const pendingName = displayName?.pending_name ?? null;
  const recentChanges = recentChangeCount(displayName?.recent_change_timestamps ?? []);
  const limitReached = recentChanges >= RENAME_LIMIT;
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

      {pendingName && (
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Pending review</p>
            <p className="text-base font-medium">{pendingName}</p>
          </div>
          <Badge variant="secondary">PENDING_REVIEW</Badge>
        </div>
      )}

      {displayName?.rejection_reason && (
        <div className="rounded-md border border-destructive/40 p-3 text-sm text-destructive">
          <p className="font-medium">Last change rejected</p>
          <p>{displayName.rejection_reason}</p>
          {displayName.rejected_at && (
            <p className="text-xs">
              {new Date(displayName.rejected_at).toLocaleDateString()}
            </p>
          )}
        </div>
      )}

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
              disabled={pendingName !== null || limitReached}
            />
            <Button
              onClick={submit}
              disabled={
                actions.isProcessing ||
                pendingName !== null ||
                limitReached ||
                newName.trim() === ''
              }
            >
              Submit
            </Button>
          </div>
          {nameError && <InputError message={nameError} className="mt-0.5" />}
          {limitReached && (
            <p className="text-xs text-destructive">
              Rename limit reached (10 changes in 30 days).
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            {recentChanges} of {RENAME_LIMIT} changes used in the last 30 days.
          </p>
        </div>
      )}
    </div>
  );
}
