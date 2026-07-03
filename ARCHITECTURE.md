# OfficeMap Packages Architecture

## Overview

OfficeMap packages follow a **domain-driven, separate-repo strategy** with **API-first integration** between backend services and frontend components.

- **Backend**: Split by domain (Composer packages)
- **Frontend**: Split by domain (npm packages)
- **Integration**: Axios-based REST API calls
- **Component Pattern**: Hybrid (default component + composable sub-components)

---

## Backend Services

Each backend service is a separate **Composer package** implementing a specific domain:

```
Backend Packages:
├── officemap/meta-sdk                    (Utility: Meta API SDK)
├── officemap/meta-webhook-router         (Utility: Webhook routing)
├── officemap/meta-webhook-validator      (Utility: Webhook validation)
├── officemap/whatsapp-messaging          (Service: Messaging API endpoints)
├── officemap/whatsapp-calling            (Service: Calling API endpoints)
└── officemap/meta-catalog                (Service: Catalog API endpoints)
```

**Key Points:**
- Each service exposes **fixed API endpoints** and **contracts**
- Services do **not** depend on frontend packages
- Backend can be developed independently
- Version independently (though usually coordinated)

---

## Frontend Packages

Each frontend package is a separate **npm package** per domain, published to npm registry:

```
Frontend Packages (published to npm):
├── @officemap/messaging-component        (npm: call officemap/whatsapp-messaging API)
├── @officemap/calling-component          (npm: call officemap/whatsapp-calling API)
├── @officemap/catalog-component          (npm: call officemap/meta-catalog API)
└── @officemap/[feature]-component        (Future: add as needed)
```

**Development:** Can use monorepo (npm workspaces) locally, but **published separately** to npm.

**Key Points:**
- Each package is **framework-agnostic** (can be used in Inertia, SPA, Vue, etc.)
- Packages are **reusable** across multiple client projects
- Version independently and publish independently
- Can have different release cycles

---

## API Contract: Backend ↔ Frontend

### Example: Messaging Service

**Backend Package:** `officemap/whatsapp-messaging`

```php
// Routes (API)
Route::post('/api/messages', [MessageController::class, 'store'])
  ->middleware('auth:sanctum');

// Response format (fixed contract)
{
  "data": {
    "id": 123,
    "contact_id": 45,
    "message": "Hello",
    "status": "sent",
    "created_at": "2026-07-03T10:00:00Z"
  }
}

// Error format (fixed contract)
{
  "message": "Validation failed",
  "errors": {
    "message": ["Required"],
    "contact_id": ["Invalid contact"]
  }
}
```

**Frontend Package:** `@officemap/messaging-component`

```typescript
// Hook calls fixed endpoint
export function useMessages() {
  const handleSend = async (data) => {
    const response = await axios.post('/api/messages', data)
    // Response format matches backend contract
    return response.data.data
  }
}

// Component uses hook
export function ChatComponent() {
  const { handleSend, errors } = useMessages()
  return <form onSubmit={(d) => handleSend(d)}>...</form>
}
```

**Contract responsibility:**
- **Backend team:** Define API endpoint, request/response format
- **Frontend team:** Implement hook & UI component matching contract
- **Both teams:** Test integration before publishing

---

## Frontend Component Pattern: Hybrid

Each frontend component is **hybrid** — clients choose usage pattern:

### Pattern 1: Ready-to-Use Component

For 80% of clients who need default experience:

```tsx
import { ChatComponent } from '@officemap/messaging-component'

export default function Dashboard() {
  return <ChatComponent onMessageSent={handleSuccess} />
}
```

- ✅ Works out-of-the-box
- ✅ No customization needed
- ✅ Auto-updates via npm

### Pattern 2: Composable Sub-Components

For 20% of clients who need custom layout:

```tsx
import { 
  useMessages,
  MessageList,
  MessageInput
} from '@officemap/messaging-component'

export default function CustomChat() {
  const { messages, handleSend, errors } = useMessages()
  
  return (
    <div className="custom-layout">
      <Sidebar>
        <Contacts />
      </Sidebar>
      
      <MainArea>
        <MessageList messages={messages} />
        <MessageInput onSend={handleSend} errors={errors} />
      </MainArea>
    </div>
  )
}
```

- ✅ Full control over layout
- ✅ Reuse hook logic (API calls)
- ✅ Auto-updates via npm

**Package Exports:**

```typescript
// @officemap/messaging-component/src/index.ts

// For pattern 1: ready-to-use
export { ChatComponent }

// For pattern 2: composable
export { useMessages }
export { MessageList }
export { MessageInput }

// Types
export type { Message, SendMessageData }
```

---

## Repository Structure

### Development: Per-Domain Repositories

Each package is a **separate repository**:

```
officemap/messaging-component/  (repo 1)
├── src/
│   ├── hooks/useMessages.ts
│   ├── components/ChatComponent.tsx
│   ├── components/MessageList.tsx
│   ├── components/MessageInput.tsx
│   └── types/messages.ts
├── dist/                       (built output, published to npm)
├── package.json
└── tsconfig.json

officemap/calling-component/    (repo 2)
├── src/...
└── package.json

officemap/catalog-component/    (repo 3)
├── src/...
└── package.json
```

**Why separate repos:**
- ✅ Independent teams can own different packages
- ✅ Different release cycles (messaging v2.1.0, calling v1.5.0, etc.)
- ✅ Clear separation of concerns
- ✅ Easy to deprecate/maintain individually

### Alternative: Monorepo (Local Development Only)

If developing multiple packages together locally:

```
officemap-components/  (development monorepo, optional)
├── packages/
│   ├── messaging-component/
│   ├── calling-component/
│   └── catalog-component/
├── package.json        (root, npm workspaces config)
└── npm install         (auto-links all packages)
```

- Develop multiple packages simultaneously
- Test integration easily
- Publish each package independently to npm
- **Only for internal development** — clients still install from npm

---

## Publishing & Versioning

### Build Process

```bash
# Develop locally (monorepo or single repo)
npm install
npm run dev              # TypeScript watch mode

# Prepare for publish (one-time)
npm run build           # Compile src/ → dist/
```

### Publish to npm

```bash
# Manual publish (when ready)
npm publish

# OR CI/CD auto-publish on version tag
# .github/workflows/publish.yml
on:
  push:
    tags: ['v*']
jobs:
  publish:
    - npm run build
    - npm publish
```

### Client Installation

```bash
# Install from npm (simple, no setup needed)
npm install @officemap/messaging-component
npm install @officemap/calling-component
npm install @officemap/catalog-component

# Or with npm workspaces (if client is also a monorepo)
npm install @officemap/messaging-component@workspace:*
```

### Versioning Strategy

- **Semantic Versioning:** v1.2.3 (major.minor.patch)
- **Coordinate releases:** When backend API changes, frontend package version bumped
- **Example:**
  - v1.0.0: Initial release (backend + frontend aligned)
  - v1.1.0: Add new message type (backend + frontend aligned)
  - v1.1.1: Bug fix in UI (frontend only)

---

## Client Integration

### Setup (Once per Project)

```bash
# 1. Install packages
npm install @officemap/messaging-component
npm install @officemap/calling-component

# 2. Setup axios interceptor (in resources/js/app.tsx)
import axios from 'axios'

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

### Usage in Pages

```tsx
// resources/js/pages/Dashboard.tsx
import { ChatComponent } from '@officemap/messaging-component'
import { CallComponent } from '@officemap/calling-component'

export default function Dashboard() {
  return (
    <div>
      <ChatComponent />
      <CallComponent />
    </div>
  )
}
```

### Customization

```tsx
// Custom messaging with composition pattern
import { 
  useMessages, 
  MessageList, 
  MessageInput 
} from '@officemap/messaging-component'

export function CustomMessaging() {
  const { messages, handleSend, errors } = useMessages()
  
  return (
    <div className="my-custom-layout">
      <header>My Chat</header>
      <MessageList messages={messages} />
      <MessageInput onSend={handleSend} errors={errors} />
    </div>
  )
}
```

---

## Error Handling & Validation

### Server-Side Validation (422)

Backend returns validation errors in **fixed format**:

```json
{
  "message": "Validation failed",
  "errors": {
    "message": ["The message field is required"],
    "contact_id": ["The contact ID must be valid"]
  }
}
```

Frontend hook captures and exposes:

```typescript
export function useMessages() {
  const [errors, setErrors] = useState({})
  
  const handleSend = async (data) => {
    try {
      const response = await axios.post('/api/messages', data)
      return response.data.data
    } catch (error) {
      if (error.response.status === 422) {
        setErrors(error.response.data.errors)
      }
      throw error
    }
  }
  
  return { handleSend, errors }
}
```

Components display errors:

```tsx
<MessageInput errors={errors} />
// → Renders: "The message field is required" under message field
```

---

## Authentication

### Sanctum + Axios Interceptor

```typescript
// Setup once at app level
axios.defaults.withCredentials = true  // For cookie-based auth
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

All API calls (from any package) automatically include auth:

```typescript
// useMessages hook
export function useMessages() {
  const handleSend = async (data) => {
    // axios automatically adds Authorization header
    const response = await axios.post('/api/messages', data)
  }
}
```

---

## Project Coordination

### Before Publishing

1. **Backend team** implements service + API endpoints
2. **Frontend team** implements hook + components matching API
3. **Both** test integration (run backend + frontend together)
4. **Both** agree on version number (e.g., v1.0.0)

### Publishing

1. Backend publishes to Composer (or keeps internal)
2. Frontend publishes to npm with same version number
3. CI/CD automates via version tags

### After Publishing

1. **Client projects** install both packages
2. **Clients** use components (pattern 1 or 2)
3. **Bug found?** → Fix backend or frontend, bump patch version (v1.0.1)
4. **API change?** → Both teams update, bump minor version (v1.1.0)

---

## Deployment Strategy

### Development

```
Local Machine:
├── laravel-whatsapp-crm/ (primary project, may use packages)
├── Package/
│   ├── whatsapp-account/ (test project, uses packages)
│   └── CLAUDE.md (shared rules)
└── Each package: separate repo (git clone / work locally)
```

### Production

```
Client Project:
├── composer install officemap/whatsapp-messaging
├── npm install @officemap/messaging-component
└── Use components via import statements
```

---

## File Structure Example: @officemap/messaging-component

```
messaging-component/          (separate git repo)
├── src/
│   ├── hooks/
│   │   ├── useMessages.ts      (Core logic: fetch, send, errors)
│   │   └── index.ts
│   ├── components/
│   │   ├── ChatComponent.tsx   (Default component, uses sub-components)
│   │   ├── MessageList.tsx     (Sub-component for composition)
│   │   ├── MessageInput.tsx    (Sub-component for composition)
│   │   └── index.ts
│   ├── types/
│   │   ├── messages.ts         (TypeScript types)
│   │   └── index.ts
│   └── index.ts                (Public exports: hook + components + types)
│
├── dist/                       (Generated, published to npm)
│   ├── hooks/
│   ├── components/
│   ├── types/
│   └── index.js + index.d.ts
│
├── package.json
├── tsconfig.json
├── .gitignore
└── README.md
```

---

## Key Principles

1. **API-First:** Backend defines contract, frontend implements to contract
2. **Reusability:** Frontend packages work in any project (Inertia, SPA, Vue, etc.)
3. **Composability:** Components provide both ready-to-use and composable patterns
4. **Independence:** Packages released independently, versioned independently
5. **Clarity:** Clear separation between backend logic and frontend UI
6. **Maintenance:** Single source of truth for each domain's logic (hook)

---

## Future Considerations

- **Multi-language support:** Package can add i18n (translations)
- **Theming:** Accept theme props or CSS variables
- **Accessibility:** Follow WCAG standards in components
- **Mobile:** Packages can be used in React Native (hooks reusable)
- **Testing:** Each package should have comprehensive test suite
- **Documentation:** Storybook or similar for component showcase
