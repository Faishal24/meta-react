# @officemap/whatsapp-account

React components and hooks for WhatsApp Business account management: embedded signup onboarding, WABA management, and phone number lifecycle.

Consumes the `officemap/whatsapp-account` backend API (see `docs/contract/api-contract.md` at the repo root). Framework-agnostic: plain React + axios, no Inertia dependency.

## Installation

```bash
npm install @officemap/whatsapp-account
```

## Usage

Two patterns are supported:

**Ready-to-use component** — works out of the box:

```tsx
// TODO: document once the default component lands
```

**Composable** — reuse the hooks with your own layout:

```tsx
// TODO: document once hooks land
```

## Development

This package lives in the `whatsapp-components` dev monorepo and is developed against the Laravel host app at the repo root.

```bash
pnpm --filter @officemap/whatsapp-account build   # compile src/ -> dist/
pnpm --filter @officemap/whatsapp-account dev     # watch mode
```
