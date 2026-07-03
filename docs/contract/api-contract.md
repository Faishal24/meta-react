# API contract — `whatsapp-account`

The JSON contract between this backend-only package and the **frontend package**
(separate). This is the single source of truth for endpoint shapes.

> **Rule:** every feature that adds or changes an endpoint updates this file **in the same
> change**. A controller/request/resource edit without an `api-contract.md` update is
> incomplete.

## Conventions

- **Base:** all routes under `config('whatsapp.route.prefix')` (default `api/whatsapp`).
- **Auth:** Sanctum (`auth:sanctum`). Default **stateful** (SPA cookie); the frontend may
  instead send `Authorization: Bearer <token>` when the consumer runs stateless. The
  frontend decides what it sends — the backend accepts either.
- **Tenancy:** every route is scoped to the caller's company
  (`config('whatsapp-account.tenant_resolver')`, default `Auth::user()->company_id`). A
  number/WABA outside the caller's company returns `404` (not `403` — don't leak existence).
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

**`WhatsAppBusinessAccountResource`** — never includes `business_token`; `token_status`
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
  "health_status": { "can_send_message": "available" }
}
```

**`WhatsAppPhoneNumberResource`** — never includes `pin`; `business_profile` is projected
from `metadata`, `users` only `whenLoaded`:

```json
{
  "id": 34,
  "phone_number_id": "106540352242922",
  "display_phone_number": "+62 812-3456-7890",
  "verified_name": "OfficeMap Sales",
  "name_status": "APPROVED",
  "quality_rating": "GREEN",
  "messaging_limit_tier": "TIER_1K",
  "throughput_level": "STANDARD",
  "code_verification_status": "VERIFIED",
  "status": "connected",
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
  "oba": { "status": "NOT_STARTED" },
  "users": [
    { "id": 7, "name": "Ari" }
  ]
}
```

**`CompanyResource`** — `{ "id": 3, "name": "OfficeMap", "business_portfolio_id": "178090…" }`.

---

## Endpoints

Legend: 🌱 planned · 🚧 in progress · ✅ shipped (shape documented).

| Method | Path | Purpose | Status |
|---|---|---|---|
| `GET` | `/onboarding/config` | app id + configuration id for the FE signup widget | 🌱 |
| `POST` | `/onboarding` | exchange `code` → token, create WABA + first phone | 🌱 |
| `POST` | `/phone-numbers` | add a subsequent number via signup `code` | 🌱 |
| `GET` | `/business-accounts` | list the company's WABAs | 🌱 |
| `GET` | `/business-accounts/{waba}` | one WABA (no token) | 🌱 |
| `POST` | `/business-accounts/{waba}/sync` | refresh from Meta | 🌱 |
| `GET` | `/phone-numbers` | list the company's numbers | 🌱 |
| `GET` | `/phone-numbers/{phoneNumber}` | one number (overview/profile/management) | 🌱 |
| `POST` | `/phone-numbers/{phoneNumber}/register` · `/deregister` · `/sync` | lifecycle | 🌱 |
| `PATCH` | `/phone-numbers/{phoneNumber}/two-step-pin` | set 2FA PIN | 🌱 |
| `PATCH` | `/phone-numbers/{phoneNumber}/business-profile` | edit profile | 🌱 |
| `PATCH` | `/phone-numbers/{phoneNumber}/display-name` | change display name | 🌱 |
| `POST` | `/phone-numbers/{phoneNumber}/oba` | request Official Business Account | 🌱 |
| `POST/DELETE` | `/phone-numbers/{phoneNumber}/users` | assign/unassign host users | 🌱 |

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
| `business_id` | optional, string |
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

**Errors** — `409` if the WABA already onboarded for this company; `422` on missing/invalid
`code`; `502` (mapped from the SDK `GraphApiException`) if the token exchange fails.

---

#### `POST /phone-numbers`

Add a subsequent number to an already-onboarded WABA (a second signup flow yields a new
`code`).

**Request** — `AddPhoneNumberRequest`

```json
{
  "code": "AQD…exchange-code-2",
  "waba_id": "102290129340398",
  "phone_number_id": "106540352299999",
  "signup_type": "WA_EMBEDDED_SIGNUP",
  "signup_event": "FINISH"
}
```

| Field | Rules |
|---|---|
| `code` | required, string |
| `waba_id` | required, string, must belong to the caller's company |
| `phone_number_id` | required, string, `unique` on phone numbers |
| `signup_type` | optional, string |
| `signup_event` | optional, string |

**Response** `202 Accepted` — `{ "data": WhatsAppPhoneNumberResource }` with `status:
"pending"`.

**Errors** — `404` if `waba_id` is outside the caller's company; `422` if
`phone_number_id` already exists.

---

### Business accounts (WABA)

#### `GET /business-accounts`

Paginated list of the company's WABAs.

**Request**

```http
GET /api/whatsapp/business-accounts?page=1
```

**Response** `200 OK`

```json
{
  "data": [
    { "id": 12, "waba_id": "102290129340398", "name": "OfficeMap Sales", "token_status": "valid", "phone_numbers_count": 2, "account_review_status": "approved" }
  ],
  "links": {
    "first": "https://host/api/whatsapp/business-accounts?page=1",
    "last": "https://host/api/whatsapp/business-accounts?page=1",
    "prev": null,
    "next": null
  },
  "meta": { "current_page": 1, "from": 1, "last_page": 1, "per_page": 15, "to": 1, "total": 1 }
}
```

---

#### `GET /business-accounts/{waba}`

One WABA, bound by `waba_id`. Never exposes `business_token`.

**Request**

```http
GET /api/whatsapp/business-accounts/102290129340398
```

**Response** `200 OK` — `{ "data": WhatsAppBusinessAccountResource }` (see resource shape
above).

**Errors** — `404` if the WABA is missing or outside the caller's company.

---

#### `POST /business-accounts/{waba}/sync`

Queue a refresh of the WABA from Meta (name, review status, health).

**Request**

```http
POST /api/whatsapp/business-accounts/102290129340398/sync
```

**Response** `202 Accepted` — the current (pre-refresh) resource; the refresh runs async:

```json
{ "data": { "id": 12, "waba_id": "102290129340398", "name": "OfficeMap Sales", "token_status": "valid" } }
```

---

### Phone numbers

#### `GET /phone-numbers`

Paginated list of the company's numbers (same envelope as `GET /business-accounts`).

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

One number, bound by `phone_number_id`. Overview + `metadata.business_profile` + `oba` +
`users` are **fields of this resource**, not separate endpoints.

**Request**

```http
GET /api/whatsapp/phone-numbers/106540352242922
```

**Response** `200 OK` — `{ "data": WhatsAppPhoneNumberResource }` (full shape above).

**Errors** — `404` out-of-tenant / unknown `phone_number_id`.

---

#### `POST /phone-numbers/{phoneNumber}/register` · `/deregister` · `/sync`

Lifecycle actions against Meta, all queued.

**Request**

```http
POST /api/whatsapp/phone-numbers/106540352242922/register
```

**Response** `202 Accepted` — `{ "data": WhatsAppPhoneNumberResource }`.

**Errors** — `409` if already in the target state (e.g. registering a `connected` number);
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
`UNDER_REVIEW`).

---

#### `POST/DELETE /phone-numbers/{phoneNumber}/users`

Assign or unassign host users to a number (the pivot). Inert (`404`/no-op) when
`config('whatsapp-account.models.user')` is `null`.

**Assign — Request**

```http
POST /api/whatsapp/phone-numbers/106540352242922/users
```

```json
{ "user_id": 7 }
```

**Unassign — Request**

```http
DELETE /api/whatsapp/phone-numbers/106540352242922/users
```

```json
{ "user_id": 7 }
```

| Field | Rules |
|---|---|
| `user_id` | required, exists on the configured user model |

**Response** `200 OK` — `{ "data": WhatsAppPhoneNumberResource }` with the refreshed
`users` array.

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
