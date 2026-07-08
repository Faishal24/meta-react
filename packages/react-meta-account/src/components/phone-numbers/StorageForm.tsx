import { useState } from 'react';

import type {MetaAccountClientConfig} from '../../client';
import { usePhoneNumberActions } from '../../hooks';
import type {StorageStatus, WhatsAppPhoneNumber} from '../../types';
import { InputError } from '../InputError';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

export interface RegionOption {
  value: string;
  label: string;
}

export interface StorageFormProps extends MetaAccountClientConfig {
  phoneNumberId: string;
  /** Current storage config (from settings.storage). */
  status?: StorageStatus;
  dataLocalizationRegion?: string;
  defaultMediaTtl?: number;
  /** Regions to choose from when IN_COUNTRY_STORAGE_ENABLED. */
  regions: RegionOption[];
  /** Storage can only change while deregistered; locks the form when true. */
  isRegistered?: boolean;
  onSuccess?: (phoneNumber: WhatsAppPhoneNumber) => void;
}

const MODES: { value: StorageStatus; label: string }[] = [
  { value: 'DEFAULT', label: 'Default (Meta-hosted)' },
  { value: 'IN_COUNTRY_STORAGE_ENABLED', label: 'In-country storage' },
  { value: 'NO_STORAGE_ENABLED', label: 'No storage' },
];

const MEDIA_TTL_MIN = 60;
const MEDIA_TTL_MAX = 43200;

export function StorageForm({
  phoneNumberId,
  status = 'DEFAULT',
  dataLocalizationRegion = '',
  defaultMediaTtl,
  regions,
  isRegistered = false,
  onSuccess,
  ...clientConfig
}: StorageFormProps) {
  const actions = usePhoneNumberActions({ phoneNumberId, onSuccess, ...clientConfig });
  const [mode, setMode] = useState<StorageStatus>(status);
  const [region, setRegion] = useState(dataLocalizationRegion);
  const [mediaTtl, setMediaTtl] = useState(
    defaultMediaTtl ? String(defaultMediaTtl) : '',
  );

  const errorFor = (field: string) => actions.errors?.[field]?.[0];

  const submit = () => {
    if (mode === 'IN_COUNTRY_STORAGE_ENABLED') {
      actions.updateStorage({ status: mode, data_localization_region: region });
    } else if (mode === 'NO_STORAGE_ENABLED') {
      actions.updateStorage({ status: mode, default_media_ttl: Number(mediaTtl) });
    } else {
      actions.updateStorage({ status: mode });
    }
  };

  if (isRegistered) {
    return (
      <p className="text-sm text-muted-foreground">
        Deregister this number before changing its storage configuration.
      </p>
    );
  }

  return (
    <div className="flex flex-col space-y-4">
      <div className="grid gap-2 sm:max-w-xs">
        <Label>Storage mode</Label>
        <Select
          value={mode}
          onValueChange={(value) => setMode(value as StorageStatus)}
          disabled={actions.isProcessing}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MODES.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errorFor('status') && <InputError message={errorFor('status')} />}
      </div>

      {mode === 'IN_COUNTRY_STORAGE_ENABLED' && (
        <div className="grid gap-2 sm:max-w-xs">
          <Label>Region</Label>
          <Select value={region} onValueChange={setRegion} disabled={actions.isProcessing}>
            <SelectTrigger>
              <SelectValue placeholder="Select a region" />
            </SelectTrigger>
            <SelectContent>
              {regions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errorFor('data_localization_region') && (
            <InputError message={errorFor('data_localization_region')} />
          )}
        </div>
      )}

      {mode === 'NO_STORAGE_ENABLED' && (
        <div className="grid gap-2 sm:max-w-xs">
          <Label>Media TTL (seconds)</Label>
          <Input
            type="number"
            inputMode="numeric"
            min={MEDIA_TTL_MIN}
            max={MEDIA_TTL_MAX}
            value={mediaTtl}
            placeholder={String(MEDIA_TTL_MIN)}
            disabled={actions.isProcessing}
            onChange={(event) => setMediaTtl(event.target.value.replace(/\D/g, ''))}
          />
          {errorFor('default_media_ttl') && (
            <InputError message={errorFor('default_media_ttl')} />
          )}
        </div>
      )}

      <Button
        disabled={actions.isProcessing}
        onClick={submit}
        className="w-min self-end"
      >
        Save
      </Button>
    </div>
  );
}
