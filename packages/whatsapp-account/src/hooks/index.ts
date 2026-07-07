/**
 * Hooks are the single source of truth for domain logic (API calls, state,
 * error handling). Components consume them internally; they are also exported
 * standalone for the composable usage pattern.
 */

export { useOnboarding } from './useOnboarding';
export type { UseOnboarding, UseOnboardingOptions } from './useOnboarding';

export { useBusinessAccounts } from './useBusinessAccounts';
export type {
  UseBusinessAccountsOptions,
  UseBusinessAccountsResult,
} from './useBusinessAccounts';

export { usePhoneNumbers } from './usePhoneNumbers';
export type {
  UsePhoneNumbersOptions,
  UsePhoneNumbersResult,
} from './usePhoneNumbers';

export { usePhoneNumber } from './usePhoneNumber';
export type {
  UsePhoneNumberOptions,
  UsePhoneNumberResult,
} from './usePhoneNumber';

export { usePhoneNumberActions } from './usePhoneNumberActions';
export type {
  UsePhoneNumberActions,
  UsePhoneNumberActionsOptions,
} from './usePhoneNumberActions';

export { useWhatsAppAccountActions } from './useWhatsAppAccountActions';
export type {
  UseWhatsAppAccountActions,
  UseWhatsAppAccountActionsOptions,
} from './useWhatsAppAccountActions';

export { useBusinessProfileForm } from './useBusinessProfileForm';
export type { UseBusinessProfileFormOptions } from './useBusinessProfileForm';
