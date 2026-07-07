import { AtSign } from 'lucide-react';

import { type WhatsAppAccountClientConfig } from '../../client';
import { useBusinessProfileForm, usePhoneNumber } from '../../hooks';
import { type BusinessProfile, type WhatsAppPhoneNumber } from '../../types';
import { BusinessProfileForm, type VerticalOption } from '../business-profile/BusinessProfileForm';
import { DisplayNameForm } from '../business-profile/DisplayNameForm';
import { SectionCard } from '../SectionCard';
import { SummaryCard } from '../business-profile/SummaryCard';
import { Skeleton } from '../ui/skeleton';

export interface PhoneNumberDetailProps extends WhatsAppAccountClientConfig {
  phoneNumberId: string;
  verticals: VerticalOption[];
  /** Whether the WABA's business is verified (drives the OBA readiness stage). */
  businessVerified?: boolean;
  onUpdated?: (phoneNumber: WhatsAppPhoneNumber) => void;
}

const EMPTY_PROFILE: BusinessProfile = {
  about: null,
  address: null,
  description: null,
  email: null,
  websites: null,
  vertical: null,
  profile_picture_url: null,
  synced_at: null,
};

interface DetailBodyProps {
  phoneNumber: WhatsAppPhoneNumber;
  verticals: VerticalOption[];
  businessVerified: boolean;
  clientConfig: WhatsAppAccountClientConfig;
  onUpdated?: (phoneNumber: WhatsAppPhoneNumber) => void;
}

// Split out so the form hook runs only once a phone number (hence its profile)
// is loaded — hooks can't be called conditionally in the container above.
function DetailBody({
  phoneNumber,
  verticals,
  businessVerified,
  clientConfig,
  onUpdated,
}: DetailBodyProps) {
  const form = useBusinessProfileForm({
    phoneNumberId: phoneNumber.phone_number_id,
    profile: phoneNumber.business_profile ?? EMPTY_PROFILE,
    onSuccess: onUpdated,
    ...clientConfig,
  });

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1fr_300px]">
      <div className="space-y-6">
        <BusinessProfileForm form={form} verticals={verticals} />

        <SectionCard icon={<AtSign className="size-5" />} title="Display name">
          <DisplayNameForm
            phoneNumberId={phoneNumber.phone_number_id}
            verifiedName={phoneNumber.verified_name}
            nameStatus={phoneNumber.name_status}
            displayName={phoneNumber.display_name}
            obaStatus={phoneNumber.oba?.status}
            onSuccess={onUpdated}
            {...clientConfig}
          />
        </SectionCard>
      </div>

      <div className="lg:sticky lg:top-6">
        <SummaryCard
          form={form}
          verifiedName={phoneNumber.verified_name}
          nameStatus={phoneNumber.name_status}
          obaStatus={phoneNumber.oba?.status}
          businessVerified={businessVerified}
          verticals={verticals}
        />
      </div>
    </div>
  );
}

export function PhoneNumberDetail({
  phoneNumberId,
  verticals,
  businessVerified = false,
  onUpdated,
  ...clientConfig
}: PhoneNumberDetailProps) {
  const { phoneNumber, isLoading, error, refetch } = usePhoneNumber({
    phoneNumberId,
    ...clientConfig,
  });

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (error || !phoneNumber) {
    return (
      <p className="text-sm text-destructive">Failed to load this number.</p>
    );
  }

  return (
    <DetailBody
      phoneNumber={phoneNumber}
      verticals={verticals}
      businessVerified={businessVerified}
      clientConfig={clientConfig}
      onUpdated={(updated) => {
        onUpdated?.(updated);
        refetch();
      }}
    />
  );
}
