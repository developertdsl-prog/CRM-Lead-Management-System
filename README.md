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

## 🚀 Core Platform Modules

- **Authentication & RBAC**: Multi-tenant onboarding, argon2/bcrypt password hashing, rotating JWT access & refresh tokens, hierarchical role enforcement.
- **Lead Lifecycle & Deduplication**: High-speed lead capture, email/phone duplicate prevention engine, RFC 4180 CSV bulk import/export, and atomic single-transaction Deal conversion.
- **Companies, Contacts & Accounts**: Unified directory with Account 360 view and dynamic custom fields engine.
- **Visual Sales Pipelines**: Interactive Kanban boards, weighted stage probabilities, and deal forecasting.
- **Activities & Productivity**: Polymorphic tasks, call logs, meeting notes, overdue reminders, and file attachments.

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
