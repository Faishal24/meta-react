import { Database, KeyRound, RefreshCw, ShieldCheck } from 'lucide-react';

import { type WhatsAppAccountClientConfig } from '../../client';
import { usePhoneNumber, usePhoneNumberActions } from '../../hooks';
import { type WhatsAppPhoneNumber } from '../../types';
import { SectionCard } from '../SectionCard';
import { Button } from '../ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog';
import { Skeleton } from '../ui/skeleton';
import { IdentityKeyCheckForm } from './IdentityKeyCheckForm';
import { StorageForm, type RegionOption } from './StorageForm';
import { TwoStepPinForm } from './TwoStepPinForm';

export interface PhoneNumberManagementProps extends WhatsAppAccountClientConfig {
  phoneNumberId: string;
  /** Regions offered when configuring in-country storage. */
  regions: RegionOption[];
  onUpdated?: (phoneNumber: WhatsAppPhoneNumber) => void;
}

interface RegistrationSectionProps {
  number: WhatsAppPhoneNumber;
  clientConfig: WhatsAppAccountClientConfig;
  onUpdated?: (phoneNumber: WhatsAppPhoneNumber) => void;
}

function RegistrationSection({ number, clientConfig, onUpdated }: RegistrationSectionProps) {
  const actions = usePhoneNumberActions({
    phoneNumberId: number.phone_number_id,
    onSuccess: onUpdated,
    ...clientConfig,
  });

  const action = number.registered ? 'Deregister' : 'Register';
  const run = () =>
    (number.registered ? actions.deregister() : actions.register()).catch(() => {});

  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm">
          Status:{' '}
          <span className="font-medium">
            {number.registered ? 'Registered' : 'Not registered'}
          </span>
        </p>
        {!number.registered && !number.has_pin && (
          <p className="text-xs text-muted-foreground">
            Set a two-step PIN before registering.
          </p>
        )}
      </div>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant={number.registered ? 'outline' : 'default'}
            disabled={actions.isProcessing}
          >
            {action}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{action} this number?</AlertDialogTitle>
            <AlertDialogDescription>
              {number.registered
                ? 'Deregistering stops this number from sending or receiving messages until it is registered again.'
                : 'Registering connects this number to the WhatsApp Business API.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={run}>{action}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface ManagementBodyProps {
  number: WhatsAppPhoneNumber;
  regions: RegionOption[];
  clientConfig: WhatsAppAccountClientConfig;
  onUpdated?: (phoneNumber: WhatsAppPhoneNumber) => void;
}

function ManagementBody({ number, regions, clientConfig, onUpdated }: ManagementBodyProps) {
  const storage = number.settings?.storage;

  return (
    <div className="space-y-6">
      <SectionCard icon={<KeyRound className="size-5" />} title="Two-step PIN">
        <TwoStepPinForm
          phoneNumberId={number.phone_number_id}
          hasPin={number.has_pin}
          onSuccess={onUpdated}
          {...clientConfig}
        />
      </SectionCard>

      <SectionCard icon={<ShieldCheck className="size-5" />} title="Identity key check">
        <IdentityKeyCheckForm
          phoneNumberId={number.phone_number_id}
          enabled={number.settings?.identity_key_check ?? false}
          onSuccess={onUpdated}
          {...clientConfig}
        />
      </SectionCard>

      <SectionCard icon={<Database className="size-5" />} title="Data storage">
        <StorageForm
          phoneNumberId={number.phone_number_id}
          status={storage?.status}
          dataLocalizationRegion={storage?.data_localization_region ?? undefined}
          defaultMediaTtl={storage?.default_media_ttl ?? undefined}
          regions={regions}
          isRegistered={number.registered}
          onSuccess={onUpdated}
          {...clientConfig}
        />
      </SectionCard>

      <SectionCard icon={<RefreshCw className="size-5" />} title="Registration">
        <RegistrationSection
          number={number}
          clientConfig={clientConfig}
          onUpdated={onUpdated}
        />
      </SectionCard>
    </div>
  );
}

export function PhoneNumberManagement({
  phoneNumberId,
  regions,
  onUpdated,
  ...clientConfig
}: PhoneNumberManagementProps) {
  const { phoneNumber, isLoading, error, refetch } = usePhoneNumber({
    phoneNumberId,
    ...clientConfig,
  });

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (error || !phoneNumber) {
    return <p className="text-sm text-destructive">Failed to load this number.</p>;
  }

  return (
    <ManagementBody
      number={phoneNumber}
      regions={regions}
      clientConfig={clientConfig}
      onUpdated={(updated) => {
        onUpdated?.(updated);
        refetch();
      }}
    />
  );
}
