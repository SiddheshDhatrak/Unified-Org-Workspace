<div align="center">

# 🏢 Unified Org Workspace

### Enterprise-Grade Multi-Tenant Support & Code Review Platform

[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.14-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://neon.tech/)
[![Redis](https://img.shields.io/badge/Redis-Upstash-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://upstash.com/)

A production-ready, full-stack monorepo platform that combines a **Support Hub** for ticket management and a **Review Console** for pull request workflows — all built with hard multi-tenant isolation, RS256 JWT authentication, role-based access control (RBAC), real-time polling, and an append-only audit log.

**[Support Hub (Live)](https://support-hub-xi-topaz.vercel.app)** · **[Review Console (Live)](https://review-hub-pink.vercel.app)**

</div>

---

## 📸 Screenshots

<div align="center">

### 🔐 Authentication — Login Page
<img src="docs/screenshots/login-page.png" alt="Login Page" width="800"/>

> Secure login with RS256 JWT tokens, HttpOnly cookies, and CSRF protection. Features a clean dark-mode interface with feature highlights.

---

### ⚙️ Organization Administration
<img src="docs/screenshots/org-settings.png" alt="Organization Settings" width="800"/>

> Full tenant administration panel — manage organization name, view immutable workspace slug, and access the danger zone for lifecycle management (soft-delete with grace period).

---

### 👥 Organization Members
<img src="docs/screenshots/members-page.png" alt="Members Management" width="800"/>

> View all organization members with their roles (ORG_ADMIN, SUPPORT_AGENT, REVIEWER_APPROVER). Invite new members, edit roles, and remove users — all with proper RBAC enforcement.

---

### 🔀 Review Console — Pull Request Board
<img src="docs/screenshots/review-console-pr-list.png" alt="Review Console PR List" width="800"/>

> Kanban-style PR management with status summaries (In Review, Approved, Merged, Draft), real-time polling, and approval progress indicators.

---

### 🔒 Session Management
<img src="docs/screenshots/session-termination.png" alt="Session Termination" width="800"/>

> Terminate all active sessions across ALL devices and dashboards with a single click. Enterprise-grade security for multi-device environments.

---

### 📝 Registration — Create Workspace
<img src="docs/screenshots/register-page.png" alt="Registration Page" width="800"/>

> New user registration with "Create New" or "Join Existing" organization modes. Create a brand-new workspace with a single form, or paste an invitation token to join an existing organization.

---

### 🎫 Ticket Detail — Support Hub
<img src="docs/screenshots/ticket-detail.png" alt="Ticket Detail View" width="800"/>

> Full ticket detail view with status workflow (Open → In Progress → Blocked → Resolved → Closed), assignee management, file attachments, and an activity/comments feed. Share tickets cross-org or delete them from the action bar.

---

### 🔍 PR Detail — Code Review with Diff Inspector
<img src="docs/screenshots/pr-detail-review.png" alt="PR Detail with Review" width="800"/>

> Pull request detail page showing the approval progress bar (1/2 approvals), reviewer assignment dropdown (+ Assign), version diff inspector with syntax-highlighted code changes, and action buttons for Approve / Request Changes.

---

### ✉️ Invite Team Member
<img src="docs/screenshots/invite-member-modal.png" alt="Invite Member Modal" width="800"/>

> Modal dialog for inviting new team members by email with role selection (Support Agent, Reviewer/Approver, Org Admin). Generates a unique invitation token that the invitee can use to join.

</div>

---

## 🏗️ Architecture Overview

```
┌────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Vercel)                          │
│  ┌─────────────────────┐        ┌──────────────────────┐          │
│  │   Support Hub Web   │        │  Review Console Web   │          │
│  │   (Next.js 14)      │        │   (Next.js 14)        │          │
│  │   Port: 3000        │        │   Port: 3001          │          │
│  └─────────┬───────────┘        └──────────┬────────────┘          │
│            │    Shared Packages (npm workspaces)     │             │
│  ┌─────────┴────────────────────────────────┴──────────┐          │
│  │  @workspace/api-client  │  @workspace/hooks         │          │
│  │  @workspace/ui-kit      │  @workspace/types         │          │
│  └─────────────────────────────────────────────────────┘          │
└────────────────────────┬───────────────────────────────────────────┘
                         │ HTTPS (API Proxy via Next.js Rewrites)
┌────────────────────────┴───────────────────────────────────────────┐
│                       BACKEND (Render)                             │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │             Express.js REST API (Port 4000)                  │  │
│  │  ┌──────────┬──────────┬──────────┬────────────┬──────────┐ │  │
│  │  │ Identity │ Tickets  │   PRs    │   Audit    │ CrossOrg │ │  │
│  │  │ Module   │ Module   │  Module  │   Module   │ Module   │ │  │
│  │  └──────────┴──────────┴──────────┴────────────┴──────────┘ │  │
│  │  Middleware: Auth → TenantScope → RBAC → RateLimit → Audit  │  │
│  └─────────────────────────────────────────────────────────────┘  │
│  ┌───────────────┐     ┌───────────────┐                          │
│  │ BullMQ Worker │     │  Cron Jobs    │                          │
│  │ (Digest Gen)  │     │ (Notif. Poll) │                          │
│  └──────┬────────┘     └───────┬───────┘                          │
└─────────┼──────────────────────┼──────────────────────────────────┘
          │                      │
  ┌───────┴──────┐       ┌──────┴───────┐
  │  PostgreSQL  │       │    Redis     │
  │   (Neon)     │       │  (Upstash)   │
  └──────────────┘       └──────────────┘
```

---

## ✨ Key Features

### 🎫 Support Hub
- **Kanban Board** — Drag-and-drop ticket management with columns: Open, In Progress, Blocked, Resolved, Closed
- **Ticket Detail** — Full ticket view with comments, assignments, priority, and version-tracked status transitions
- **Cross-Org Sharing** — Share tickets with partner organizations through approved connections
- **Smart Filtering** — Search, sort, and filter tickets by status, priority, and assignee

### 🔀 Review Console
- **PR Lifecycle** — Full workflow: Draft → In Review → Approved → Merged
- **Reviewer Assignment** — Assign reviewers from organization members with proper role filtering
- **Version Diff Inspector** — Visual diff viewer for tracking code changes across PR versions
- **Approval Tracking** — Progress bars showing approval count vs required threshold

### 🔐 Security & Identity
- **RS256 JWT** — Asymmetric key authentication with short-lived access tokens (15min) and long-lived refresh tokens (30d)
- **HttpOnly Cookies** — Tokens stored in HttpOnly, Secure, SameSite cookies (immune to XSS)
- **CSRF Protection** — Double-submit cookie pattern for all state-changing requests
- **Argon2 Password Hashing** — Memory-hard hashing resistant to GPU/ASIC attacks
- **Session Management** — View and terminate sessions across all devices
- **Silent Token Refresh** — Transparent 401-retry flow with automatic re-auth

### 🏛️ Multi-Tenancy
- **Hard Tenant Isolation** — Every database query is scoped by `orgId` via middleware
- **Organization Switching** — Seamless org context switching from the dashboard header
- **Cross-Org Connections** — Formal connection request/approval flow between organizations
- **Invitation System** — Token-based member invitations with role assignment

### 🛡️ RBAC (Role-Based Access Control)
| Role | Support Hub | Review Console | Admin |
|------|-------------|----------------|-------|
| `ORG_ADMIN` | ✅ Full Access | ✅ Full Access | ✅ Settings, Members, Flags |
| `SUPPORT_AGENT` | ✅ Tickets Only | ❌ No Access | ❌ Read-Only |
| `REVIEWER_APPROVER` | ❌ No Access | ✅ Review & Approve | ❌ Read-Only |
| `CROSS_ORG_GUEST` | 👁️ Shared Items Only | 👁️ Shared Items Only | ❌ No Access |

### 📊 Compliance & Monitoring
- **Append-Only Audit Log** — Every action is recorded with actor, IP, session, before/after values
- **Feature Flags** — Per-org toggles for progressive rollout and A/B testing
- **Notification System** — Real-time polling-based notification feed (30s intervals)
- **AI Digest** — BullMQ-powered background worker for generating periodic activity summaries

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend Framework** | Next.js 14 (App Router) | SSR, API proxying, routing |
| **UI Library** | React 18 + Custom UI Kit | Component-based architecture |
| **State Management** | TanStack React Query + Zustand | Server state caching + client state |
| **Backend Framework** | Express.js 4 | REST API server |
| **Language** | TypeScript 5.4 | End-to-end type safety |
| **ORM** | Prisma 5.14 | Type-safe database access |
| **Database** | PostgreSQL (Neon) | Primary data store |
| **Cache / Queue** | Redis (Upstash) + BullMQ | Rate limiting, job queues |
| **Auth** | RS256 JWT + Argon2 | Asymmetric token auth |
| **Validation** | Zod | Runtime schema validation |
| **Monitoring** | Pino + prom-client | Structured logging + Prometheus metrics |
| **Security** | Helmet + CORS + CSRF | HTTP hardening |
| **Deployment** | Vercel (Frontend) + Render (Backend) | Cloud hosting |

---

## 📁 Project Structure

```
Unified-Org-Workspace/
├── backend/                          # Express.js API Server
│   ├── prisma/
│   │   ├── schema.prisma             # Database schema (19 models)
│   │   ├── migrations/               # Prisma migration files
│   │   └── seed.ts                   # Database seed script
│   ├── src/
│   │   ├── config/                   # DB, Redis, JWT configuration
│   │   ├── middleware/               # Auth, RBAC, TenantScope, RateLimit
│   │   │   ├── auth.middleware.ts
│   │   │   ├── rbac.middleware.ts
│   │   │   ├── tenantScope.middleware.ts
│   │   │   ├── rateLimit.middleware.ts
│   │   │   ├── auditCapture.middleware.ts
│   │   │   ├── errorHandler.middleware.ts
│   │   │   └── requestId.middleware.ts
│   │   ├── modules/
│   │   │   ├── identity/             # Auth, registration, sessions
│   │   │   ├── organization/         # Org CRUD, members, invitations
│   │   │   ├── tickets/              # Ticket management
│   │   │   ├── prs/                  # Pull request lifecycle
│   │   │   ├── crossOrg/             # Cross-org connections & sharing
│   │   │   ├── audit/                # Append-only audit log
│   │   │   ├── notifications/        # Notification feed
│   │   │   ├── featureFlags/         # Per-org feature toggles
│   │   │   └── aiDigest/             # AI summary generation
│   │   ├── jobs/                     # BullMQ workers
│   │   ├── shared/                   # Error classes, constants
│   │   ├── tests/                    # Unit & security tests
│   │   ├── app.ts                    # Express app setup
│   │   └── server.ts                 # HTTP server entry point
│   ├── Dockerfile                    # Multi-stage Docker build
│   ├── docker-compose.yml            # Local dev (Postgres + Redis)
│   └── package.json
│
├── frontend/                         # npm Workspaces Monorepo
│   ├── apps/
│   │   ├── support-hub-web/          # Support Hub (Next.js 14)
│   │   └── review-console-web/       # Review Console (Next.js 14)
│   ├── packages/
│   │   ├── api-client/               # Centralized API client
│   │   ├── hooks/                    # React Query hooks + Zustand
│   │   ├── types/                    # Shared TypeScript types
│   │   └── ui-kit/                   # Reusable UI components
│   ├── tsconfig.base.json
│   └── package.json
│
├── jwtRS256.key                      # RSA private key (RS256)
├── jwtRS256.key.pub                  # RSA public key (RS256)
├── docs/screenshots/                 # Application screenshots
└── .gitignore
```

---

## 🚀 Live Deployment

| Service | URL | Platform |
|---------|-----|----------|
| **Support Hub** | [https://support-hub-xi-topaz.vercel.app](https://support-hub-xi-topaz.vercel.app) | Vercel |
| **Review Console** | [https://review-hub-pink.vercel.app](https://review-hub-pink.vercel.app) | Vercel |
| **Backend API** | Hosted on Render | Render (Docker) |
| **Database** | PostgreSQL | Neon |
| **Cache/Queue** | Redis | Upstash |

---

## 🧪 Test Credentials

All seeded accounts use the same password. You can use these to explore the platform immediately:

| Email | Password | Org | Role | Access |
|-------|----------|-----|------|--------|
| `alice@acme.com` | `Password123!` | Acme Corp | ORG_ADMIN | Full admin access to both apps |
| `bob@acme.com` | `Password123!` | Acme Corp | SUPPORT_AGENT + REVIEWER_APPROVER | Tickets + PR reviews |
| `charlie@globex.com` | `Password123!` | Globex Corporation | ORG_ADMIN | Full admin for Globex |
| `superadmin@unified.org` | `Password123!` | Platform | PLATFORM_SUPER_ADMIN | God-mode access |

> **💡 Quick Start:** Log in as `alice@acme.com` on the Support Hub, create a ticket, then switch to the Review Console to manage pull requests. Log in as `bob@acme.com` in a separate browser to test reviewer workflows and cross-role interactions.

---

## 💻 Local Development Setup

### Prerequisites

- **Node.js** ≥ 20.x
- **npm** ≥ 9.x
- **Docker & Docker Compose** (for local PostgreSQL + Redis)
- **OpenSSL** (for generating RSA keys, if needed)

### 1. Clone the Repository

```bash
git clone https://github.com/SiddheshDhatrak/Unified-Org-Workspace.git
cd Unified-Org-Workspace
```

### 2. Generate RSA Keys (if not present)

```bash
openssl genrsa -out jwtRS256.key 2048
openssl rsa -in jwtRS256.key -pubout -out jwtRS256.key.pub
```

### 3. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Start local PostgreSQL and Redis via Docker
docker-compose up -d

# Copy environment variables
cp .env.example .env
# Edit .env and set:
#   DATABASE_URL   → your local or Neon connection string
#   REDIS_URL      → your local or Upstash connection string
#   JWT_PRIVATE_KEY → contents of ../jwtRS256.key (as multi-line PEM)
#   JWT_PUBLIC_KEY  → contents of ../jwtRS256.key.pub (as multi-line PEM)
#   CORS_ALLOWED_ORIGINS → http://localhost:3000,http://localhost:3001
#   COOKIE_DOMAIN  → localhost

# Run database migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Seed the database with test data
npm run db:seed

# Start the backend server (port 4000)
npm run dev

# In a separate terminal, start the BullMQ digest worker
npm run worker
```

### 4. Frontend Setup

```bash
cd frontend

# Install all workspace dependencies
npm install

# Start Support Hub (port 3000) — in one terminal
npm run dev:support

# Start Review Console (port 3001) — in another terminal
npm run dev:review
```

### 5. Access the Application

| App | Local URL |
|-----|-----------|
| Support Hub | [http://localhost:3000](http://localhost:3000) |
| Review Console | [http://localhost:3001](http://localhost:3001) |
| Backend API | [http://localhost:4000](http://localhost:4000) |

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/auth/register` | Register new user + create org |
| `POST` | `/api/v1/auth/login` | Login with email/password |
| `POST` | `/api/v1/auth/logout` | Logout current session |
| `POST` | `/api/v1/auth/logout-all` | Terminate all sessions |
| `POST` | `/api/v1/auth/refresh` | Silent token refresh |
| `GET` | `/api/v1/auth/me` | Get current session |
| `POST` | `/api/v1/auth/switch-org` | Switch active organization |

### Tickets (Support Hub)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/tickets` | List tickets (paginated) |
| `POST` | `/api/v1/tickets` | Create ticket |
| `GET` | `/api/v1/tickets/:id` | Get ticket details |
| `PATCH` | `/api/v1/tickets/:id` | Update ticket (OCC) |
| `PATCH` | `/api/v1/tickets/:id/assign` | Assign ticket |
| `DELETE` | `/api/v1/tickets/:id` | Soft-delete ticket |
| `GET` | `/api/v1/tickets/:id/comments` | List comments |
| `POST` | `/api/v1/tickets/:id/comments` | Add comment |
| `POST` | `/api/v1/tickets/:id/share` | Share with partner org |

### Pull Requests (Review Console)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/prs` | List pull requests |
| `POST` | `/api/v1/prs` | Create PR |
| `GET` | `/api/v1/prs/:id` | Get PR details |
| `POST` | `/api/v1/prs/:id/submit` | Submit PR for review (DRAFT → IN_REVIEW) |
| `POST` | `/api/v1/prs/:id/reviewers` | Assign reviewer |
| `POST` | `/api/v1/prs/:id/review` | Submit review (APPROVE/CHANGES_REQUESTED) |
| `POST` | `/api/v1/prs/:id/merge` | Merge PR |
| `GET` | `/api/v1/prs/:id/versions` | List PR versions |
| `POST` | `/api/v1/prs/:id/rollback` | Rollback to previous version |
| `GET` | `/api/v1/prs/:id/comments` | List PR comments |
| `POST` | `/api/v1/prs/:id/comments` | Add comment |

### Organization Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/organizations/:id` | Get org settings |
| `PATCH` | `/api/v1/organizations/:id` | Update org settings |
| `GET` | `/api/v1/organizations/:id/members` | List members |
| `POST` | `/api/v1/organizations/:id/members/invite` | Invite member |
| `PATCH` | `/api/v1/organizations/:id/members/:userId` | Update member role |
| `DELETE` | `/api/v1/organizations/:id/members/:userId` | Remove member |
| `GET` | `/api/v1/organizations/:id/feature-flags` | List feature flags |
| `PATCH` | `/api/v1/organizations/:id/feature-flags/:key` | Toggle feature flag |

### Cross-Org, Audit & Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/org-connections` | List connections |
| `POST` | `/api/v1/org-connections` | Request connection |
| `POST` | `/api/v1/org-connections/:id/approve` | Approve connection |
| `GET` | `/api/v1/audit` | List audit events (paginated) |
| `GET` | `/api/v1/audit/export` | Export audit as CSV |
| `GET` | `/api/v1/notifications` | List notifications |
| `PATCH` | `/api/v1/notifications/:id/read` | Mark as read |
| `PATCH` | `/api/v1/notifications/read-all` | Mark all as read |

> **Note:** All org-scoped endpoints require the `x-org-id` header for tenant isolation.

---

## 🔒 Security Architecture

```
Request Flow:
─────────────

Client Request
     │
     ▼
┌─────────────┐
│  Helmet.js  │  ← Security headers (CSP, HSTS, XSS protection)
└──────┬──────┘
       ▼
┌─────────────┐
│   CORS      │  ← Whitelist-only origin validation
└──────┬──────┘
       ▼
┌─────────────┐
│ Rate Limiter│  ← Redis-backed sliding window (100 req/15min)
└──────┬──────┘
       ▼
┌─────────────┐
│  Auth MW    │  ← RS256 JWT verification from HttpOnly cookies
│             │     + CSRF double-submit cookie validation
└──────┬──────┘
       ▼
┌─────────────┐
│ TenantScope │  ← Injects orgId from x-org-id header
│             │     Validates membership + org status
└──────┬──────┘
       ▼
┌─────────────┐
│   RBAC MW   │  ← Permission matrix check (role × action)
└──────┬──────┘
       ▼
┌─────────────┐
│  Route      │  ← Business logic execution
│  Handler    │
└──────┬──────┘
       ▼
┌─────────────┐
│ Audit Capture│ ← Append-only audit event recording
└─────────────┘
```

---

## 🗃️ Database Schema

The system uses **19 Prisma models** with the following core entities:

| Model | Description |
|-------|-------------|
| `User` | Platform users with Argon2 password hashes |
| `Organization` | Multi-tenant organizations with settings |
| `Membership` | User ↔ Org binding with role + status |
| `Session` | Active login sessions (multi-device) |
| `RefreshToken` | Rotatable refresh tokens with hash chain |
| `Invitation` | Token-based org invitations |
| `Ticket` | Support tickets with OCC versioning |
| `TicketComment` | Threaded ticket comments |
| `PullRequest` | Code review PRs with approval threshold |
| `PRReviewer` | Reviewer assignments with decisions |
| `PRVersion` | Immutable version snapshots with diffs |
| `PRComment` | Version-anchored review comments |
| `OrgConnection` | Cross-org connection requests |
| `TicketShare` / `PRShare` | Cross-org resource sharing |
| `AuditEvent` | Append-only compliance audit trail |
| `FeatureFlag` | Per-org feature toggles |
| `Notification` | User notification feed |
| `Digest` | AI-generated activity summaries |

---

## 🧰 Available Scripts

### Backend (`/backend`)
```bash
npm run dev           # Start dev server with ts-node
npm run build         # Compile TypeScript to dist/
npm run start         # Start production server
npm run worker        # Start BullMQ digest worker
npm run db:migrate    # Run Prisma migrations
npm run db:seed       # Seed database with test data
npm run db:generate   # Regenerate Prisma client
npm run test          # Run all tests
npm run test:unit     # Run unit tests only
npm run test:security # Run security tests
```

### Frontend (`/frontend`)
```bash
npm run dev:support   # Start Support Hub (port 3000)
npm run dev:review    # Start Review Console (port 3001)
npm run build         # Build all workspaces
npm run test          # Run all workspace tests
npm run lint          # Lint all workspaces
```

---

## 🐳 Docker Deployment

### Local Development (Docker Compose)
```bash
cd backend
docker-compose up -d    # Starts PostgreSQL + Redis
```

### Production (Backend Only)
```bash
cd backend
docker build -t unified-workspace-api .
docker run -p 4000:4000 --env-file .env unified-workspace-api
```

---

## 🌐 Environment Variables

### Backend (`.env`)
```env
# Database & Cache
DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public"
REDIS_URL="redis://default:token@host:port"

# Application
NODE_ENV="production"
PORT="4000"

# JWT (RS256 keypair — PEM format)
JWT_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"

# Security
ACCESS_TOKEN_TTL="15m"
REFRESH_TOKEN_TTL="30d"
COOKIE_DOMAIN="your-domain.com"
CORS_ALLOWED_ORIGINS="https://support-hub.vercel.app,https://review-hub.vercel.app"

# External (Optional)
LLM_API_KEY="optional-for-ai-digest"
```

### Frontend (`next.config.js` — environment)
```env
NEXT_PUBLIC_API_BASE_URL="https://your-backend.onrender.com"
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is built as a demonstration of enterprise-grade full-stack architecture patterns.

---

<div align="center">

**Built with ❤️ by [Siddhesh Dhatrak](https://github.com/SiddheshDhatrak)**

</div>
