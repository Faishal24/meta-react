# @officemap/react-meta-account

React components and hooks for Meta WhatsApp account management: embedded signup onboarding, WABA management, and phone number lifecycle.

Consumes the `officemap/meta-account` backend API (see the OpenAPI spec `v1.yaml`, a sibling of this repo). Framework-agnostic: plain React + axios, no Inertia dependency.

## Installation

```bash
npm install @officemap/react-meta-account
```

All components accept the same client config — `baseUrl` (default `api/whatsapp`) and an optional `axios` instance whose interceptors (auth) are reused.

## Components

### Containers (ready-to-use, load their own data)

These fetch a phone number by id and compose the pieces below into a full panel:

- **`PhoneNumberDetail`** — business profile + display name + live summary. Props: `phoneNumberId`, `verticals`, `businessVerified?`, `onUpdated?`.
- **`PhoneNumberManagement`** — two-step PIN + identity key + storage + register/deregister (with confirm dialog). Props: `phoneNumberId`, `regions`, `onUpdated?`.

### Self-contained (ready-to-use, single purpose)

- **`BusinessAccountList`** — table of the tenant's WABAs (`onSelect?`, `onSync?`).
- **`PhoneNumberSelect`** — dropdown selector of the tenant's numbers (`onSelect`).
- **`OnboardingButton`** — launches Meta Embedded Signup (`mode="onboarding" | "add-number"`).
- **`RefreshTokenButton`** — manually refresh a WABA's business token (`wabaId`).

### Pieces (composable — you provide the layout / form)

- **`BusinessProfileForm`** — takes a `form` from `useBusinessProfileForm`.
- **`SummaryCard`** — live preview, also takes that `form`.
- **`DisplayNameForm`** — current/pending name, rejection, rename quota.
- **`ObaForm`** — Official Business Account application.
- **`TwoStepPinForm`**, **`IdentityKeyCheckForm`**, **`StorageForm`** — individual management controls.
- **`SectionCard`**, **`InputError`** — generic layout helpers.

## Hooks

Every piece/container is built on these; use them directly for a fully custom UI:

- **`useOnboarding`** — signup config + launch.
- **`useBusinessAccounts`**, **`usePhoneNumbers`**, **`usePhoneNumber`** — reads.
- **`usePhoneNumberActions`** — all phone-number mutations.
- **`useWhatsAppAccountActions`** — WABA sync + token refresh.
- **`useBusinessProfileForm`** — business-profile form state.

## Development

This package lives in the `meta-react` packages-only monorepo. Components are mounted in the `playground/` Vite app (with mocked network via MSW) during development.

```bash
pnpm --filter @officemap/react-meta-account build   # compile src/ -> dist/
pnpm --filter @officemap/react-meta-account dev     # watch mode
pnpm --filter @officemap/react-meta-account test    # vitest
pnpm --filter playground dev                         # run the component playground
```
