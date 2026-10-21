# Git Branching & 7-Branch Release Strategy

This document defines the strict branching policy for the **CRM & Lead Management System**. All feature branches are created off the base branch **`dev`**.

---

## 1. Branch Hierarchy

- **Base Branch**: `dev`
- **Feature Branches**: `feat/branch-N-<name>`

| Branch # | Branch Name | Scope |
|---|---|---|
| **Branch 1** | **`dev`** | Monorepo scaffolding, PostgreSQL 16 Docker, 24-Entity Prisma Schema, Shared Types, Threat Model |
| **Branch 2** | `feat/branch-2-auth-tenancy-rbac` | Multi-Tenant Auth, JWT Rotation, Roles & Permissions, Org Shell UI |
| **Branch 3** | `feat/branch-3-leads-management` | Lead CRUD, Status Pipeline, Conversion, Deduplication, CSV Import/Export |
| **Branch 4** | `feat/branch-4-contacts-companies-accounts`| Contacts, Companies, Account 360 View, Custom Fields Engine |
| **Branch 5** | `feat/branch-5-sales-pipeline-kanban-deals`| Pipelines, Drag & Drop Kanban Deals, Revenue Forecasting |
| **Branch 6** | `feat/branch-6-activities-tasks-productivity`| Tasks, Calls, Meetings, Calendar View, S3 Attachments |
| **Branch 7** | `feat/branch-7-automations-notifications-analytics`| BullMQ Background Automations, In-App Notifications, Dashboard Analytics |

---

## 2. Configuration for Multiple Git Accounts

This project is configured locally to use:
- **Git User Name**: `developertdsl-prog`
- **Git Email**: `developer.tdsl@gmail.com`
- **SSH Command**: `ssh -i ~/.ssh/id_rsa -o IdentitiesOnly=yes`

```bash
git config core.sshCommand "ssh -i ~/.ssh/id_rsa -o IdentitiesOnly=yes"
git config user.name "developertdsl-prog"
git config user.email "developer.tdsl@gmail.com"
git remote add origin git@github.com:developertdsl-prog/CRM-Lead-Management-System.git
```

This guarantees all commits and pushes from this repository strictly use the `developertdsl-prog` account without password prompts.
