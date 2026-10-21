# Enterprise CRM & Lead Management System

A production-grade, multi-tenant CRM and Lead Management System built with **Next.js**, **NestJS**, **PostgreSQL**, **Prisma**, **Redis**, and **BullMQ**.

---

## 🌟 Architecture Highlights

- **Multi-Tenant Row-Level Isolation**: Every tenant query enforces `organizationId` matching authenticated memberships; zero cross-tenant leakage.
- **Microservices-Ready Monorepo**: Managed via `pnpm` workspaces separating `apps/api`, `apps/web`, `packages/database`, and `packages/shared-types`.
- **Relational Data Model**: 24 normalized PostgreSQL models covering Leads, Pipelines, Stages, Deals, Contacts, Companies, Activities, Custom Fields, Automations, and Audit Logs.
- **Secure Authentication & RBAC**: Short-lived JWTs, Redis-backed refresh token rotation, and granular role permissions (`OWNER`, `ADMIN`, `MANAGER`, `SALES_REP`, `READ_ONLY`).
- **Interactive OpenAPI Documentation**: Swagger 3.0 documentation live at `/api/docs`.

---

## 📁 Repository Layout

```
├── apps/
│   ├── api/                   # NestJS Application (REST API, Swagger, BullMQ)
│   └── web/                   # Next.js App Router (React, Tailwind CSS, shadcn/ui)
├── packages/
│   ├── database/              # Prisma schema, migrations, generated client, and seeds
│   └── shared-types/          # Shared DTOs, Enums, API contracts, and validation
├── docker/
│   └── docker-compose.yml     # PostgreSQL 16, Redis 7, MinIO S3, MailHog
├── docs/
│   ├── phased-roadmap.md      # Detailed phase-by-phase execution plan
│   ├── git-branching-strategy.md # Git commands to push each phase to branches
│   ├── architecture.md        # C4 diagram, modular structure, technology justification
│   ├── data-model.md          # ERD diagram, tables, relationships, and indexes
│   ├── threat-model.md        # STRIDE security analysis & defense-in-depth
│   └── api-specification.md   # RESTful conventions, pagination, and error responses
├── package.json               # Monorepo root scripts
├── pnpm-workspace.yaml        # pnpm workspace definition
└── .env.example               # Complete environment variable documentation
```

---

## 🌿 Phased Roadmap & Git Branching

Every phase is delivered as a discrete, functional release. You can commit and push each phase into its own Git branch:

| Phase | Branch Name | Scope / Deliverable | Status |
|---|---|---|---|
| **Phase 0** | `phase-0-foundation` | Architecture, Data Model (Prisma), Monorepo Scaffolding, Docker, Threat Model | **COMPLETE** |
| **Phase 1** | `phase-1-auth-tenancy` | Multi-tenant Auth, JWT Rotation, Roles/Permissions, Org Management, UI Auth Pages | Pending |
| **Phase 2** | `phase-2-lead-management` | Lead CRUD, Status Pipeline, Conversion, Deduplication, CSV Import/Export, Timeline | Pending |
| **Phase 3** | `phase-3-contacts-companies` | Contacts, Companies, Account 360 View, Custom Fields Engine, Interaction History | Pending |
| **Phase 4** | `phase-4-pipelines-deals` | Kanban Pipeline, Drag & Drop Stages, Deal Forecasting, Won/Lost Workflows | Pending |
| **Phase 5** | `phase-5-activities-productivity` | Tasks, Calls, Meetings, Rich Notes, Due Date Alerts, Calendar View, S3 Attachments | Pending |
| **Phase 6** | `phase-6-automation-notifications` | BullMQ Event Automations, Auto-assignment, In-app Notifications, Email Alerts | Pending |
| **Phase 7** | `phase-7-reports-analytics` | Conversion Funnel, Pipeline Velocity, Win/Loss Rate, Team Leaderboard, Exports | Pending |
| **Phase 8** | `phase-8-devops-e2e-hardening` | Rate Limiting, Security Audit, Health Checks, CI/CD Actions, Playwright E2E | Pending |

### Git Commands to Push Phase 0

```bash
# 1. Switch to Phase 0 branch
git checkout -b phase-0-foundation

# 2. Stage all files
git add .

# 3. Commit Phase 0
git commit -m "feat(phase-0): requirements, architecture, data model, monorepo scaffolding, and threat model"

# 4. Set your remote repository (if not already set)
git remote add origin https://github.com/YOUR_USERNAME_OR_ORG/crm-lead-management-system.git

# 5. Push to your branch
git push -u origin phase-0-foundation
```

---

## 🚀 Local Development Setup

### 1. Prerequisites
- Node.js >= 20.x
- pnpm >= 9.x
- Docker & Docker Compose (or local PostgreSQL & Redis)

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Start Infrastructure
```bash
pnpm docker:up
```

### 4. Setup Database & Seed
```bash
cp .env.example .env
pnpm db:generate
pnpm db:push
pnpm db:seed
```

### 5. Start Development Servers
```bash
# Runs backend on http://localhost:4000 and frontend on http://localhost:3000 concurrently
pnpm dev
```
