/**
 * Types mirroring the backend API contract.
 *
 * Source of truth: the backend OpenAPI spec (v1.yaml, sibling of this repo).
 * Timestamps are ISO 8601 strings. Enum-cast fields arrive as plain strings.
 * Secrets (business_token, pin) never appear in any response, so they are
 * intentionally absent here.
 */

/** Derived token health on the WABA resource. */
export type TokenStatus = 'no_token' | 'expired' | 'expiring_soon' | 'valid';

/** The tenant — a Meta business portfolio. */
export interface BusinessPortfolio {
  id: number;
  business_portfolio_id: string;
  name: string;
  verification_status: string | null;
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

export interface WhatsAppAccount {
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
  created_at: string | null;
  updated_at: string | null;
  phone_numbers?: WhatsAppPhoneNumber[];
}

/** Display-name change tracking; sub-keys are always present (null/[] when unset). */
export interface DisplayNameInfo {
  pending_name: string | null;
  rejection_reason: string | null;
  rejected_at: string | null;
  /** ISO 8601 timestamps in the rolling 30-day window (10-changes/30-days cap). */
  recent_change_timestamps: string[];
}

export interface PhoneNumberSettings {
  identity_key_check: boolean;
  storage: {
    status: StorageStatus;
    data_localization_region?: string | null;
    default_media_ttl?: number | null;
  };
}

export interface WhatsAppPhoneNumber {
  id: number;
  whatsapp_account_id: number;
  phone_number_id: string;
  display_phone_number: string;
  verified_name: string | null;
  name_status: string | null;
  quality_rating: string | null;
  messaging_limit_tier: string | null;
  throughput_level: string | null;
  code_verification_status: string | null;
  status: string;
  /** Derived from status (connected/flagged/rate_limited/restricted). */
  registered: boolean;
  has_pin: boolean;
  registered_at: string | null;
  business_profile?: BusinessProfile | null;
  display_name?: DisplayNameInfo | null;
  settings?: PhoneNumberSettings | null;
  oba?: { status: string } | null;
  created_at: string | null;
  updated_at: string | null;
}

/** Laravel validation error envelope (HTTP 422). */
export interface ValidationErrors {
  [field: string]: string[];
}

/* -------------------------------------------------------------------------- */
/* Mutation request payloads (per the v1.yaml OpenAPI spec)                   */
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

/** `PATCH /phone-numbers/{phoneNumber}/identity-key-check`. */
export interface UpdateIdentityKeyCheckPayload {
  enabled: boolean;
}

export type StorageStatus =
  | 'DEFAULT'
  | 'IN_COUNTRY_STORAGE_ENABLED'
  | 'NO_STORAGE_ENABLED';

/**
 * `PATCH /phone-numbers/{phoneNumber}/storage`.
 * `data_localization_region` required when IN_COUNTRY; `default_media_ttl` only
 * when NO_STORAGE. Requires the number to be deregistered first.
 */
export interface UpdateStoragePayload {
  status: StorageStatus;
  data_localization_region?: string;
  default_media_ttl?: number;
}

/**
 * `GET /onboarding/config` — bootstrap data for the Meta signup widget.
 * Plain object (no `data` wrapper). The active portfolio now lives on
 * `GET /context` (ContextResponse), not here.
 */
export interface OnboardingConfig {
  app_id: string;
  configuration_id: string;
}

/** `POST /onboarding` — first-time onboarding (create WABA + first number). */
export interface CompleteOnboardingPayload {
  code: string;
  waba_id: string;
  phone_number_id: string;
  business_id: string;
  coexistence?: boolean;
}

/** `POST /phone-numbers` — add a number, or register a new WABA under the portfolio. */
export interface AddPhoneNumberPayload {
  code: string;
  waba_id: string;
  phone_number_id: string;
  coexistence?: boolean;
}

/** Session data emitted by the Meta Embedded Signup popup via `postMessage`. */
export interface EmbeddedSignupSession {
  waba_id: string;
  phone_number_id: string;
  business_id?: string;
}

/** A portfolio the caller may switch to, with its display name and status. */
export interface AvailablePortfolio {
  business_portfolio_id: string;
  name: string | null;
  verification_status: string | null;
}

/**
 * `GET /context` — the caller's active number (with WABA + portfolio derived
 * from it) and the portfolios they may switch between. All nullable fields are
 * null before a number is selected. Plain object (no `data` wrapper).
 */
export interface ContextResponse {
  /** The active number's portfolio, or null when nothing is selected. */
  business_portfolio_id: string | null;
  /** The active number's WABA (WABA follows the number), or null. */
  waba_id: string | null;
  /** The active phone number, or null when nothing is selected. */
  phone_number_id: string | null;
  /** Portfolios the caller may switch between, from the tenant scope. */
  available_portfolios: AvailablePortfolio[];
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
