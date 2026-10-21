# System Threat Model & Security Architecture

This document provides a comprehensive security review and STRIDE threat analysis for the multi-tenant **CRM & Lead Management System**.

---

## 1. Multi-Tenant Isolation Strategy

The system uses a **shared-database, row-level multi-tenancy model with strict application-level and database-level enforcement**.

### Isolation Architecture
1. **Tenant Anchor**: Every tenant is represented by an `Organization` record.
2. **Mandatory Foreign Key**: Every tenant-owned table (`users`, `leads`, `contacts`, `companies`, `deals`, `activities`, `custom_fields`, `audit_logs`, `attachments`) carries a non-nullable `organizationId` foreign key referencing `organizations(id)`.
3. **Composite Indexing**: Queries are indexed on `(organizationId, id)` and `(organizationId, createdAt)` to guarantee both query performance and eliminate index-level cross-tenant scanning.
4. **Server-Side Context Enforcement**:
   - The client never passes an `organizationId` query parameter that is blindly trusted.
   - The authenticated user's `Membership` determines their active `organizationId`, injected securely by the authentication middleware into `req.user.organizationId`.
   - All repository/database queries automatically append `where: { organizationId: req.user.organizationId, ... }`.
5. **No Cross-Tenant Foreign Keys**: Foreign keys between entities (e.g. `deal.leadId`, `activity.contactId`) are validated to ensure both entities share the identical `organizationId`.

---

## 2. STRIDE Threat Analysis

| Threat Category | Potential Threat | Mitigation & Security Defense |
|---|---|---|
| **Spoofing** | Attacker impersonates legitimate user or tenant admin. | - Argon2id / Bcrypt password hashing (work factor 12).<br>- Short-lived JWT access tokens (15 minutes).<br>- Cryptographically secure refresh tokens stored in Redis with revocation upon rotation.<br>- Multi-factor authentication (TOTP) readiness.<br>- Email verification before activating full privileges. |
| **Tampering** | Attacker modifies another tenant's leads, deals, or settings. | - Strict Prisma tenant filters on every mutating query (`update`, `delete`, `upsert`).<br>- DTO validation using `class-validator` / Zod with strict whitelist (`forbidNonWhitelisted: true`).<br>- Read-only audit logs capturing author ID, IP address, user-agent, and JSON delta. |
| **Repudiation** | User denies altering deal values or deleting customer records. | - Centralized `AuditLog` module recording every create, update, delete, status transition, and export action.<br>- Tamper-evident immutable audit log design. |
| **Information Disclosure** | Data leak across tenant boundaries or unauthorized field access. | - Sensitive fields (`passwordHash`, `refreshToken`, `sessionSecret`) stripped from API outputs via NestJS `ClassSerializerInterceptor`.<br>- TLS/HTTPS enforced in transit.<br>- S3 file attachments served only via time-limited pre-signed URLs (15 min expiry).<br>- Granular RBAC permissions preventing low-privilege roles from reading confidential deal values. |
| **Denial of Service** | Volumetric requests overwhelm backend or database. | - NestJS `@nestjs/throttler` rate limiting per IP and per authenticated user.<br>- Strict pagination limits (max page size: 100 items).<br>- Heavy background tasks (CSV import, report aggregation, bulk email) offloaded to BullMQ workers with concurrency bounds. |
| **Elevation of Privilege** | Sales representative attempts admin or owner actions. | - Declarative `@RequirePermissions(...)` and `@Roles(...)` metadata guards evaluated on every controller endpoint.<br>- Server-side membership verification ensuring role cannot be self-elevated. |

---

## 3. Input Validation & Defense-in-Depth

### 1. Zero Trust Client Input
- All incoming payloads pass through NestJS `ValidationPipe` with:
  ```typescript
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  })
  ```
- Any unauthorized keys in the request body are immediately rejected with HTTP 400 Bad Request.

### 2. SQL Injection Defense
- Prisma ORM constructs parameterized queries for all relational operations. Raw queries are banned except for audited analytical aggregations that strictly use Prisma's `$queryRaw` tagged template literals.

### 3. Cross-Site Scripting (XSS) & Content Security
- Next.js automatically escapes JSX bindings.
- Helmet middleware sets HTTP security headers:
  - `Content-Security-Policy`
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains`

### 4. File Upload Security
- Direct user uploads to the application server are prohibited.
- Files must be uploaded directly to S3 / MinIO via time-limited pre-signed PUT URLs.
- MIME-type whitelisting and max file size limits (25MB) enforced server-side before issuing pre-signed URLs.
