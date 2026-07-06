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

export { PhoneNumberSelect } from './PhoneNumberSelect';
export type { PhoneNumberSelectProps } from './PhoneNumberSelect';

export { SectionCard } from './business-profile/SectionCard';
export type { SectionCardProps } from './business-profile/SectionCard';

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
