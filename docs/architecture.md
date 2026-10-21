# High-Level Architecture & Technical Specification

This document details the architectural foundation, design principles, modular structure, and interaction patterns of the **CRM & Lead Management System**.

---

## 1. System Context & C4 Architecture

```mermaid
C4Context
    title System Context Diagram - CRM & Lead Management System
    
    Person(user, "CRM User", "Sales rep, account executive, manager, or administrator")
    System(crm, "CRM & Lead Management Platform", "Multi-tenant SaaS platform managing leads, contacts, deals, activities, and reporting")
    System_Ext(smtp, "SMTP Server / MailHog", "Outbound emails, alerts, verification")
    System_Ext(s3, "S3-compatible Object Storage", "MinIO / AWS S3 for document attachments")
    System_Ext(db, "PostgreSQL 16", "Primary ACID relational store")
    System_Ext(redis, "Redis 7 & BullMQ", "Session cache and asynchronous job queues")

    Rel(user, crm, "Accesses via HTTPS", "Next.js SPA / REST API")
    Rel(crm, db, "Reads / Writes tenant data", "Prisma ORM (Connection Pool)")
    Rel(crm, redis, "Dispatches background tasks & caches sessions", "ioredis / BullMQ")
    Rel(crm, s3, "Uploads / Downloads files", "Pre-signed S3 URLs")
    Rel(crm, smtp, "Sends system notifications", "Nodemailer / SMTP")
```

---

## 2. Monorepo Structure

```
crm-system/
├── apps/
│   ├── api/                   # NestJS Application (REST API, Swagger, BullMQ)
│   │   ├── src/
│   │   │   ├── common/        # Guards, Interceptors, Filters, Pipes, Decorators
│   │   │   ├── config/        # Environment config schema (Joi / Zod)
│   │   │   ├── modules/       # Domain modules (Auth, Leads, Deals, Activities, etc.)
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   │   ├── test/              # E2E & unit test suites
│   │   └── package.json
│   │
│   └── web/                   # Next.js App Router (React, Tailwind CSS, shadcn/ui)
│       ├── src/
│       │   ├── app/           # App router layouts and pages
│       │   ├── components/    # Reusable UI library (Tables, Modals, Badges, Charts)
│       │   ├── hooks/         # Custom React hooks (useAuth, useLeads, useDebounce)
│       │   ├── lib/           # API client (Axios/Ky), formatting, validation
│       │   └── types/         # Client-specific interfaces
│       └── package.json
│
├── packages/
│   ├── database/              # Prisma schema, migrations, generated client, and seeds
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── seed.ts
│   │   └── package.json
│   │
│   └── shared-types/          # Shared DTOs, Enums, API contracts, and validation
│       ├── src/
│       │   ├── enums/
│       │   ├── dtos/
│       │   └── index.ts
│       └── package.json
│
├── docker/                    # Docker Compose & container configurations
├── docs/                      # Architecture, threat model, API specs, and guides
└── package.json               # Monorepo root
```

---

## 3. Technology Stack Justification

| Layer | Selected Tech | Architecture Rationale |
|---|---|---|
| **Frontend Framework** | **Next.js 14+ (App Router)** | Server Components for optimal initial render, client components for rich interactive dashboards, optimized font/image loading. |
| **Styling & Components** | **Tailwind CSS + shadcn/ui** | Highly modular, accessible UI primitives (Radix UI) styled with consistent design tokens and dark mode support. |
| **Backend Framework** | **NestJS (TypeScript)** | Enterprise-grade modular architecture with native dependency injection, decorators, middleware, and OpenAPI generator. |
| **Database & ORM** | **PostgreSQL 16 + Prisma** | Strict ACID transactional compliance, foreign key cascade constraints, JSONB column support, and type-safe query generation. |
| **Caching & Queues** | **Redis 7 + BullMQ** | High-throughput asynchronous job execution for email notifications, CSV imports, and event-driven automation rules. |
| **Object Storage** | **S3-compatible (MinIO / AWS S3)** | Secure, pre-signed URL workflow ensuring zero binary streaming through API servers. |
| **API Specification** | **OpenAPI 3.0 / Swagger** | Automatically generated interactive documentation accessible at `/api/docs`. |

---

## 4. Multi-Tenant Request Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor Client as Browser Client
    participant GW as Reverse Proxy / Nginx
    participant Guard as JwtAuthGuard & OrgGuard
    participant Ctrl as LeadsController
    participant Svc as LeadsService
    participant DB as PostgreSQL (Prisma)
    participant Q as BullMQ (Redis)

    Client->>GW: POST /api/v1/leads (Bearer JWT)
    GW->>Guard: Validate Authorization Header
    Guard->>Guard: Verify JWT, extract userId & activeOrgId
    Guard->>Ctrl: Pass validated execution context (req.user)
    Ctrl->>Svc: createLead(req.user.organizationId, req.user.id, createLeadDto)
    Svc->>DB: prisma.lead.create({ data: { organizationId, ownerId, ... } })
    DB-->>Svc: Persisted Lead Record
    Svc->>Q: Dispatch 'lead.created' event job
    Svc-->>Ctrl: Standardized API Response
    Ctrl-->>Client: HTTP 201 Created { success: true, data: lead }
```
