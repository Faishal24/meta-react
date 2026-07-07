# API contract — `meta-account`

The JSON contract between this backend-only package and the **frontend package**
(separate). This is the single source of truth for endpoint shapes.

> **Rule:** every feature that adds or changes an endpoint updates this file **in the same
> change**. A controller/request/resource edit without an `api-contract.md` update is
> incomplete.

## Conventions

- **Base:** all routes under `config('meta.route.prefix')` (default `api/whatsapp`).
- **Auth:** Sanctum (`auth:sanctum`). Default **stateful** (SPA cookie); the frontend may
  instead send `Authorization: Bearer <token>` when the consumer runs stateless. The
  frontend decides what it sends — the backend accepts either.
- **Tenancy:** every route is scoped to the caller's `business_portfolio_id`
  (`config('meta-account.tenant_resolver')`, default **null** — the consumer binds it,
  e.g. `Auth::user()->business_portfolio_id`). A number/WABA outside the caller's portfolio
  returns `404` (not `403` — don't leak existence).
- **Binding:** `{phoneNumber}` binds by `phone_number_id`; `{waba}` by `waba_id`.
- **Success:** reads return `{ "data": … }` (JsonResource). Mutations return the updated
  resource (`200`) or `202` when the real work is queued, with `{ "data": … }`.
- **Errors:** Laravel's default JSON error envelope — `422` `{ "message", "errors": {…} }`
  for validation, `404` for out-of-tenant / missing, `409` for lifecycle conflicts, `401`
  unauthenticated.
- **Secrets never serialized:** `business_token` and `pin` are `$hidden` and never appear
  in any response.
- **Timestamps:** ISO 8601 (`2026-07-03T09:14:22+00:00`). Enum-cast fields serialize as
  their plain string value.
- **All examples below** assume the header set `Accept: application/json` and (stateless)
  `Authorization: Bearer <token>`; omit the header when running stateful (SPA cookie).

## Resource shapes (referenced throughout)

**`WhatsAppAccountResource`** — never includes `business_token`; `token_status`
is derived (`no_token|expired|expiring_soon|valid`):

```json
{
  "id": 12,
  "waba_id": "102290129340398",
  "name": "OfficeMap Sales",
  "token_status": "valid",
  "token_expires_at": "2026-09-01T00:00:00+00:00",
  "phone_numbers_count": 2,
  "webhook_subscribed_at": "2026-07-03T09:10:04+00:00",
  "status": "CONNECTED",
  "currency": "USD",
  "country": "ID",
  "business_verification_status": "verified",
  "account_review_status": "approved",
  "health_status": { "can_send_message": "available" },
  "created_at": "2026-07-03T09:00:00+00:00",
  "updated_at": "2026-07-03T09:10:04+00:00"
}
```

**`WhatsAppPhoneNumberResource`** — never includes `pin`; exposes `has_pin` (boolean) so the
FE knows whether a two-step PIN is set without ever seeing its value. `registered` is
derived from `status` (`PhoneNumberStatus::isRegistered()` — true for
connected/flagged/rate_limited/restricted) so the FE doesn't have to duplicate that mapping.
`business_profile`, `display_name`, `settings` are each their own column (not projected
from a shared bucket). `display_name` always carries all four sub-keys, `null`/`[]` when
unset rather than absent: `pending_name` (the submitted name awaiting review),
`rejection_reason` / `rejected_at` (written by the `phone_number_name_update` webhook
handler on a REJECTED decision — not implemented yet, so always `null` until it lands),
and `recent_change_timestamps` (ISO 8601 timestamps pruned to the rolling 30-day window,
backing the 10-changes/30-days cap). `settings` carries `identity_key_check` and `storage`.
**No commerce fields** (`is_cart_enabled`,
`is_catalog_visible`, `commerce_settings_synced_at` in the reference CRM) — this package
stores no commerce columns on phone numbers by design (AGENTS.md #7); a sibling package
(catalog) adds those:

```json
{
  "id": 34,
  "whatsapp_account_id": 12,
  "phone_number_id": "106540352242922",
  "display_phone_number": "+62 812-3456-7890",
  "verified_name": "OfficeMap Sales",
  "name_status": "APPROVED",
  "quality_rating": "GREEN",
  "messaging_limit_tier": "TIER_1K",
  "throughput_level": "STANDARD",
  "code_verification_status": "VERIFIED",
  "status": "connected",
  "registered": true,
  "has_pin": true,
  "registered_at": "2026-07-03T09:12:41+00:00",
  "business_profile": {
    "about": "We ship maps.",
    "address": "Jl. Sudirman 1, Jakarta",
    "description": "Office mapping solutions.",
    "email": "sales@officemap.test",
    "websites": ["https://officemap.test"],
    "vertical": "PROF_SERVICES",
    "profile_picture_url": "https://…/photo.jpg",
    "synced_at": "2026-07-03T09:12:45+00:00"
  },
  "display_name": {
    "pending_name": "OfficeMap Support",
    "rejection_reason": null,
    "rejected_at": null,
    "recent_change_timestamps": ["2026-07-03T09:10:00+00:00"]
  },
  "settings": {
    "identity_key_check": true,
    "storage": { "status": "DEFAULT" }
  },
  "oba": { "status": "NOT_STARTED" },
  "created_at": "2026-07-03T09:11:00+00:00",
  "updated_at": "2026-07-03T09:12:45+00:00"
}
```

**`BusinessPortfolioResource`** (the tenant) —
`{ "id": 3, "business_portfolio_id": "178090…", "name": "Office Map", "verification_status": "verified" }`.

---

## Endpoints

Legend: 🌱 planned · 🚧 in progress · ✅ shipped (shape documented).

| Method | Path | Purpose | Status |
|---|---|---|---|
| `GET` | `/onboarding/config` | app id + configuration id for the FE signup widget | ✅ |
| `POST` | `/onboarding` | exchange `code` → token, create WABA + first phone | ✅ |
| `POST` | `/phone-numbers` | add a subsequent number via signup `code` | ✅ |
| `GET` | `/whatsapp-accounts` | list the tenant's WABAs | ✅ |
| `GET` | `/whatsapp-accounts/{waba}` | one WABA (no token) | ✅ |
| `POST` | `/whatsapp-accounts/{waba}/sync` | refresh from Meta | ✅ |
| `POST` | `/whatsapp-accounts/{waba}/refresh-token` | manually refresh the business token | ✅ |
| `GET` | `/phone-numbers` | list the tenant's numbers | ✅ |
| `GET` | `/phone-numbers/{phoneNumber}` | one number (overview/profile/management) | ✅ |
| `POST` | `/phone-numbers/{phoneNumber}/sync` | refresh from Meta | ✅ |
| `POST` | `/phone-numbers/{phoneNumber}/register` · `/deregister` | lifecycle | ✅ |
| `PATCH` | `/phone-numbers/{phoneNumber}/two-step-pin` | set 2FA PIN | ✅ |
| `PATCH` | `/phone-numbers/{phoneNumber}/business-profile` | edit profile (incl. photo via Resumable Upload) | ✅ |
| `PATCH` | `/phone-numbers/{phoneNumber}/display-name` | change display name | ✅ |
| `POST` | `/phone-numbers/{phoneNumber}/oba` | request Official Business Account | ✅ |
| `PATCH` | `/phone-numbers/{phoneNumber}/identity-key-check` | toggle identity key check | ✅ |
| `PATCH` | `/phone-numbers/{phoneNumber}/storage` | data storage configuration | ✅ |

---

### Onboarding (Embedded Signup)

#### `GET /onboarding/config`

Public-to-the-frontend config for booting the Meta signup widget. Not a JsonResource — a
plain object; no `data` wrapper.

**Request**

```http
GET /api/whatsapp/onboarding/config
```

**Response** `200 OK`

```json
{
  "app_id": "1234567890",
  "configuration_id": "988776655443322"
}
```

---

#### `POST /onboarding`

Exchange the signup `code` for the WABA system-user token and create the WABA + its first
phone number. Rows are created synchronously; side-effects (webhook subscribe, number
register, profile fetch) run via **queued jobs** — hence `202`.

**Request** — `CompleteOnboardingRequest`

```http
POST /api/whatsapp/onboarding
Content-Type: application/json
```

```json
{
  "code": "AQD…exchange-code",
  "waba_id": "102290129340398",
  "phone_number_id": "106540352242922",
  "business_id": "178090992340127",
  "coexistence": false
}
```

| Field | Rules |
|---|---|
| `code` | required, string |
| `waba_id` | required, string |
| `phone_number_id` | required, string |
| `business_id` | required, string |
| `coexistence` | optional, boolean (default `false`) |

**Response** `202 Accepted` — the created WABA with its first phone nested:

```json
{
  "data": {
    "id": 12,
    "waba_id": "102290129340398",
    "name": "OfficeMap Sales",
    "token_status": "valid",
    "phone_numbers_count": 1,
    "webhook_subscribed_at": null,
    "status": null,
    "account_review_status": "pending",
    "phone_numbers": [
      {
        "id": 34,
        "phone_number_id": "106540352242922",
        "display_phone_number": "+62 812-3456-7890",
        "status": "pending",
        "code_verification_status": "UNVERIFIED"
      }
    ]
  }
}
```

**Errors** — `409` if the WABA already onboarded for this portfolio; `422` on missing/invalid
`code`; `502` (mapped from the SDK `GraphApiException`) if the token exchange fails.

---

#### `POST /phone-numbers`

Add a subsequent number to an already-onboarded WABA (a second signup flow yields a new
`code`) — **or** register a brand-new WABA under the caller's own portfolio, when
`waba_id` isn't known yet. A new WABA is only accepted after verifying, via Meta's
`owner_business_info`, that it actually belongs to the caller's resolved portfolio
(matches the reference CRM's check) — this only runs when the caller resolves to a
single portfolio (`config('meta-account.tenant_resolver')`); an unscoped or multi-portfolio
caller can still add a number to an *existing* WABA, just not register a new one with an
assigned portfolio.

If the token exchange fails but the WABA already exists with a still-usable stored token
(not expired), the request still succeeds using that stored token — a brand-new WABA has
no such fallback.

**Request** — `AddPhoneNumberRequest`

```json
{
  "code": "AQD…exchange-code-2",
  "waba_id": "102290129340398",
  "phone_number_id": "106540352299999",
  "coexistence": false
}
```

| Field | Rules |
|---|---|
| `code` | required, string |
| `waba_id` | required, string |
| `phone_number_id` | required, string, `unique` on phone numbers |
| `coexistence` | optional, boolean (default `false`) — same flag as `POST /onboarding`; drives `signup_event` |

**Response** `202 Accepted` — `{ "data": WhatsAppPhoneNumberResource }` with `status:
"pending"`.

**Errors** — `404` if an *existing* `waba_id` is outside the caller's portfolio (existence
not leaked); `422` if a *new* `waba_id` turns out to belong to a different business
portfolio, or if `phone_number_id` already exists; `502` on a Meta/Graph failure with no
usable fallback token.

---

### Business accounts (WABA)

#### `GET /whatsapp-accounts`

Paginated list of the tenant's WABAs.

**Request**

```http
GET /api/whatsapp/whatsapp-accounts?page=1
```

**Response** `200 OK`

```json
{
  "data": [
    { "id": 12, "waba_id": "102290129340398", "name": "OfficeMap Sales", "token_status": "valid", "phone_numbers_count": 2, "account_review_status": "approved" }
  ],
  "links": {
    "first": "https://host/api/whatsapp/whatsapp-accounts?page=1",
    "last": "https://host/api/whatsapp/whatsapp-accounts?page=1",
    "prev": null,
    "next": null
  },
  "meta": { "current_page": 1, "from": 1, "last_page": 1, "per_page": 15, "to": 1, "total": 1 }
}
```

---

#### `GET /whatsapp-accounts/{waba}`

One WABA, bound by `waba_id`. Never exposes `business_token`.

**Request**

```http
GET /api/whatsapp/whatsapp-accounts/102290129340398
```

**Response** `200 OK` — `{ "data": WhatsAppAccountResource }` (see resource shape
above).

**Errors** — `404` if the WABA is missing or outside the caller's portfolio.

---

#### `POST /whatsapp-accounts/{waba}/sync`

Refresh the WABA from Meta (name, review status, health) — **synchronous**: the request
blocks until the refresh completes, so the FE shows a loading state rather than polling.

**Request**

```http
POST /api/whatsapp/whatsapp-accounts/102290129340398/sync
```

**Response** `200 OK` — the refreshed resource:

```json
{ "data": { "id": 12, "waba_id": "102290129340398", "name": "OfficeMap Sales", "token_status": "valid" } }
```

**Errors** — `502` on a Meta/Graph failure.

---

#### `POST /whatsapp-accounts/{waba}/refresh-token`

Manually refresh the WABA's business token (`fb_exchange_token`, ~60-day extension) —
the on-demand counterpart to the daily `meta-account:refresh-business-tokens` schedule.
Uses the existing `OnboardingService::refreshToken()`.

**Request**

```http
POST /api/whatsapp/whatsapp-accounts/102290129340398/refresh-token
```

**Response** `200 OK` — the WABA with its new `token_expires_at`:

```json
{ "data": { "id": 12, "waba_id": "102290129340398", "token_status": "valid", "token_expires_at": "2026-09-05T00:00:00+00:00" } }
```

**Errors** — `409` if the WABA has no token to refresh (`no_token` status); `502` on a Meta/Graph failure.

---

### Phone numbers

#### `GET /phone-numbers`

Paginated list of the tenant's numbers (same envelope as `GET /whatsapp-accounts`).

**Response** `200 OK`

```json
{
  "data": [
    { "id": 34, "phone_number_id": "106540352242922", "display_phone_number": "+62 812-3456-7890", "status": "connected", "quality_rating": "GREEN" }
  ],
  "meta": { "current_page": 1, "last_page": 1, "per_page": 15, "total": 1 }
}
```

---

#### `GET /phone-numbers/{phoneNumber}`

One number management, business profile, calling (on whatsapp-calling package) not separate endpoints.

**Request**

```http
GET /api/whatsapp/phone-numbers/106540352242922
```

**Response** `200 OK` — `{ "data": WhatsAppPhoneNumberResource }` (full shape above).

**Errors** — `404` out-of-tenant / unknown `phone_number_id`.

---

#### `POST /phone-numbers/{phoneNumber}/register` · `/deregister` · `/sync`

Lifecycle actions against Meta — **synchronous**: each blocks until Meta responds, so the
FE shows a loading state rather than polling for a queued result.

**Request**

```http
POST /api/whatsapp/phone-numbers/106540352242922/register
```

**Response** `200 OK` — `{ "data": WhatsAppPhoneNumberResource }` with the updated state.

**Errors** — `409` if already in the target state (e.g. registering a `connected` number);
`422` if `register` is called with no two-step PIN set; `502` on a Meta/Graph failure;
`404` out-of-tenant.

```json
{ "message": "This phone number is already registered." }
```

---

#### `PATCH /phone-numbers/{phoneNumber}/two-step-pin`

Set the two-step verification PIN. The `pin` is encrypted at rest and **never** serialized
back.

**Request** — `UpdateTwoStepPinRequest`

```json
{ "pin": "123456" }
```

| Field | Rules |
|---|---|
| `pin` | required, digits:6 |

**Response** `200 OK` — `{ "data": WhatsAppPhoneNumberResource }` (no `pin` field present).

**Errors** — `422` if not exactly 6 digits.

```json
{ "message": "The pin field must be 6 digits.", "errors": { "pin": ["The pin field must be 6 digits."] } }
```

---

#### `PATCH /phone-numbers/{phoneNumber}/identity-key-check`

Toggle end-to-end identity key verification. Write-only on Meta's side (`GET /settings`
never returns it), so the value is mirrored in the `settings` column for reads.

**Request** — `UpdateIdentityKeyCheckRequest`

```json
{ "enabled": true }
```

| Field | Rules |
|---|---|
| `enabled` | required, boolean |

**Response** `200 OK` — `{ "data": WhatsAppPhoneNumberResource }` with
`settings.identity_key_check` updated.

---

#### `PATCH /phone-numbers/{phoneNumber}/storage`

Configure data storage: default, in-country (with region), or no-storage (with media
TTL). **Requires the number to be deregistered first** — Meta rejects the change
otherwise.

**Request** — `UpdateStorageConfigurationRequest`

```json
{ "status": "IN_COUNTRY_STORAGE_ENABLED", "data_localization_region": "ID" }
```

| Field | Rules |
|---|---|
| `status` | required, in `DEFAULT` / `IN_COUNTRY_STORAGE_ENABLED` / `NO_STORAGE_ENABLED` |
| `data_localization_region` | required_if `status=IN_COUNTRY_STORAGE_ENABLED`, else prohibited |
| `default_media_ttl` | prohibited unless `status=NO_STORAGE_ENABLED`, integer `60–43200` |

**Response** `200 OK` — `{ "data": WhatsAppPhoneNumberResource }` with `settings.storage.*`
updated.

**Errors** — `409` if the number is currently registered (must deregister first).

```json
{ "message": "Deregister this phone number before changing its storage configuration." }
```

---

#### `PATCH /phone-numbers/{phoneNumber}/business-profile`

Edit the business profile. All fields `sometimes|nullable`. `photo` is a multipart upload
(image ≤5 MB); the rest are JSON.

**Request** — `UpdateBusinessProfileRequest`

```json
{
  "about": "We ship maps.",
  "address": "Jl. Sudirman 1, Jakarta",
  "description": "Office mapping solutions.",
  "email": "sales@officemap.test",
  "websites": ["https://officemap.test"],
  "vertical": "PROF_SERVICES"
}
```

| Field | Rules |
|---|---|
| `about` | sometimes, nullable, `≤139` |
| `address` | sometimes, nullable, `≤256` |
| `description` | sometimes, nullable, `≤512` |
| `email` | sometimes, nullable, email |
| `websites` | sometimes, nullable, array `≤2`, each url |
| `vertical` | sometimes, nullable, in the vertical list |
| `photo` | sometimes, nullable, image `≤5MB` (multipart) |

**Response** `200 OK` — `{ "data": WhatsAppPhoneNumberResource }` with the updated
`business_profile` (and a fresh `synced_at`).

---

#### `PATCH /phone-numbers/{phoneNumber}/display-name`

Request a display-name change (Meta re-reviews, so `name_status` returns to
`PENDING_REVIEW`); queued.

**Request** — `UpdateDisplayNameRequest`

```json
{ "new_display_name": "OfficeMap Support" }
```

| Field | Rules |
|---|---|
| `new_display_name` | required, string `≤75` |

**Response** `202 Accepted` — `{ "data": WhatsAppPhoneNumberResource }` with
`name_status: "PENDING_REVIEW"`.

**Errors** — `409` if the current name is locked by an approved OBA, or the number has
already changed its name 10 times in the last 30 days (tracked in
`display_name.recent_change_timestamps`).

> **Known limitation:** resolving a pending change into `verified_name`/`name_status`
> happens via the `phone_number_name_update` webhook, which isn't implemented yet
> (tracked separately) — a request currently stays `PENDING_REVIEW` until that lands, even
> if Meta instant-approves it.

---

#### `POST /phone-numbers/{phoneNumber}/oba`

Apply for an Official Business Account (green tick).

**Request** — `ObaApplicationRequest`

```json
{
  "business_website_url": "https://officemap.test",
  "primary_country_of_operation": "ID",
  "primary_language": "id_ID",
  "parent_business_or_brand": "OfficeMap Group",
  "supporting_links": [
    "https://twitter.com/officemap",
    "https://instagram.com/officemap",
    "https://facebook.com/officemap",
    "https://linkedin.com/company/officemap",
    "https://officemap.test/about"
  ],
  "additional_supporting_information": "Featured in local press."
}
```

| Field | Rules |
|---|---|
| `business_website_url` | required, url |
| `primary_country_of_operation` | required, size:2 |
| `primary_language` | optional, string |
| `parent_business_or_brand` | optional, string |
| `supporting_links` | optional, array `5–10`, each url |
| `additional_supporting_information` | optional, `≤1024` |

**Response** `202 Accepted` — `{ "data": WhatsAppPhoneNumberResource }` with
`oba.status: "PENDING"`.

**Errors** — `409` if the current `oba.status` doesn't allow a new application (e.g.
`UNDER_REVIEW`), or a 30-day cooldown after a rejection is still active.

> **Known limitation:** resolving the submitted application into an approved/rejected
> outcome happens via the `account_alerts` webhook, which isn't implemented yet (tracked
> separately) — a submission stays `PENDING` until that lands.

---

## Error envelopes (reference)

Laravel defaults; the SDK's `GraphApiException` subtypes map to appropriate 4xx/5xx in one
handler.

**`401 Unauthenticated`**

```json
{ "message": "Unauthenticated." }
```

**`404 Not Found`** — missing, or out-of-tenant (existence not leaked):

```json
{ "message": "No query results for model [WhatsAppPhoneNumber]." }
```

**`409 Conflict`** — lifecycle:

```json
{ "message": "This phone number is already registered." }
```

**`422 Unprocessable Entity`** — validation:

```json
{
  "message": "The websites field must not have more than 2 items.",
  "errors": { "websites": ["The websites field must not have more than 2 items."] }
}
```

---

## Deferred (no CRM reference)

Blocked-users, QR codes, and an HTTP endpoint for conversational automation are **not**
planned for the first cut — the CRM has no reference implementation. If added later they
run directly over `MetaTransport` and get documented here.
