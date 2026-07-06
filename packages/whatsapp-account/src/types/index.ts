/**
 * Types mirroring the backend API contract.
 *
 * Source of truth: docs/contract/api-contract.md (repo root).
 * Timestamps are ISO 8601 strings. Enum-cast fields arrive as plain strings.
 * Secrets (business_token, pin) never appear in any response, so they are
 * intentionally absent here.
 */

/** Derived token health on the WABA resource. */
export type TokenStatus = 'no_token' | 'expired' | 'expiring_soon' | 'valid';

export interface Company {
  id: number;
  name: string;
  business_portfolio_id: string;
}

/** Projected from phone number metadata; part of WhatsAppPhoneNumber. */
export interface BusinessProfile {
  about: string | null;
  address: string | null;
  description: string | null;
  email: string | null;
  websites: string[] | null;
  vertical: string | null;
  profile_picture_url: string | null;
  synced_at: string | null;
}

export interface WhatsAppBusinessAccount {
  id: number;
  waba_id: string;
  name: string;
  token_status: TokenStatus;
  token_expires_at: string | null;
  phone_numbers_count: number;
  webhook_subscribed_at: string | null;
  status: string | null;
  currency: string | null;
  country: string | null;
  business_verification_status: string | null;
  account_review_status: string | null;
  health_status: Record<string, unknown> | null;
  phone_numbers?: WhatsAppPhoneNumber[];
}

export interface WhatsAppPhoneNumber {
  id: number;
  phone_number_id: string;
  display_phone_number: string;
  verified_name: string | null;
  name_status: string | null;
  quality_rating: string | null;
  messaging_limit_tier: string | null;
  throughput_level: string | null;
  code_verification_status: string | null;
  status: string;
  registered_at: string | null;
  business_profile?: BusinessProfile | null;
  oba?: { status: string } | null;
  users?: PhoneNumberUser[];
}

export interface PhoneNumberUser {
  id: number;
  name: string;
}

/** Laravel validation error envelope (HTTP 422). */
export interface ValidationErrors {
  [field: string]: string[];
}

/* -------------------------------------------------------------------------- */
/* Mutation request payloads (per docs/contract/api-contract.md)              */
/* -------------------------------------------------------------------------- */

/** `PATCH /phone-numbers/{phoneNumber}/two-step-pin` — 6 digits. */
export interface UpdateTwoStepPinPayload {
  pin: string;
}

/**
 * `PATCH /phone-numbers/{phoneNumber}/business-profile`.
 * All fields optional; `photo` is a multipart File (sent as FormData).
 */
export interface UpdateBusinessProfilePayload {
  about?: string | null;
  address?: string | null;
  description?: string | null;
  email?: string | null;
  websites?: string[] | null;
  vertical?: string | null;
  photo?: File | null;
}

/** `PATCH /phone-numbers/{phoneNumber}/display-name`. */
export interface UpdateDisplayNamePayload {
  new_display_name: string;
}

/** `POST /phone-numbers/{phoneNumber}/oba`. */
export interface ObaApplicationPayload {
  business_website_url: string;
  primary_country_of_operation: string;
  primary_language?: string | null;
  parent_business_or_brand?: string | null;
  supporting_links?: string[] | null;
  additional_supporting_information?: string | null;
}

/**
 * `GET /onboarding/config` — bootstrap data for the Meta signup widget.
 * Plain object (no `data` wrapper).
 */
export interface OnboardingConfig {
  app_id: string;
  configuration_id: string;
  /** Optional: pre-fills the signup popup with the company's business portfolio. */
  business_portfolio_id?: string | null;
}

/** `POST /onboarding` — first-time onboarding (create WABA + first number). */
export interface CompleteOnboardingPayload {
  code: string;
  waba_id: string;
  phone_number_id: string;
  business_id?: string;
  coexistence?: boolean;
}

/** `POST /phone-numbers` — add a subsequent number to an onboarded WABA. */
export interface AddPhoneNumberPayload {
  code: string;
  waba_id: string;
  phone_number_id: string;
  signup_type?: string;
  signup_event?: string;
}

/** Session data emitted by the Meta Embedded Signup popup via `postMessage`. */
export interface EmbeddedSignupSession {
  waba_id: string;
  phone_number_id: string;
  signup_type: string;
  signup_event: string;
}

/** Laravel paginated collection envelope. */
export interface Paginated<T> {
  data: T[];
  links: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    from: number | null;
    last_page: number;
    per_page: number;
    to: number | null;
    total: number;
  };
}
