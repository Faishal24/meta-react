/**
 * Components follow the hybrid pattern: a ready-to-use default component plus
 * composable sub-components. UI patterns should follow the CRM reference
 * (laravel-whatsapp-crm/resources/js/components/business-profile/).
 *
 * Components must stay Inertia-free: navigation and page data flow through
 * props/callbacks, never through @inertiajs/react imports.
 */

export { BusinessAccountList } from './BusinessAccountList';
export type { BusinessAccountListProps } from './BusinessAccountList';

export { PhoneNumberSelect } from './phone-numbers/PhoneNumberSelect';
export type { PhoneNumberSelectProps } from './phone-numbers/PhoneNumberSelect';

export { SectionCard } from './SectionCard';
export type { SectionCardProps } from './SectionCard';

export { InputError } from './InputError';
export type { InputErrorProps } from './InputError';

export { BusinessProfileForm } from './business-profile/BusinessProfileForm';
export type {
  BusinessProfileFormProps,
  VerticalOption,
} from './business-profile/BusinessProfileForm';

export { DisplayNameForm } from './business-profile/DisplayNameForm';
export type { DisplayNameFormProps } from './business-profile/DisplayNameForm';

export { SummaryCard } from './business-profile/SummaryCard';
export type { SummaryCardProps } from './business-profile/SummaryCard';

export { ObaForm } from './business-profile/ObaForm';
export type { ObaFormProps } from './business-profile/ObaForm';

export { TwoStepPinForm } from './phone-numbers/TwoStepPinForm';
export type { TwoStepPinFormProps } from './phone-numbers/TwoStepPinForm';

export { IdentityKeyCheckForm } from './phone-numbers/IdentityKeyCheckForm';
export type { IdentityKeyCheckFormProps } from './phone-numbers/IdentityKeyCheckForm';

export { StorageForm } from './phone-numbers/StorageForm';
export type { StorageFormProps, RegionOption } from './phone-numbers/StorageForm';

export { OnboardingButton } from './OnboardingButton';
export type { OnboardingButtonProps } from './OnboardingButton';

export { RefreshTokenButton } from './RefreshTokenButton';
export type { RefreshTokenButtonProps } from './RefreshTokenButton';

export { PhoneNumberDetail } from './phone-numbers/PhoneNumberDetail';
export type { PhoneNumberDetailProps } from './phone-numbers/PhoneNumberDetail';
