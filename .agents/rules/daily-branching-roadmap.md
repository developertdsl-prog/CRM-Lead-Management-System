# Rule: CRM Daily Phased Branching Execution

1. Root Base: `main`
2. Development Base: `dev` (all feature branches originate from `dev`)
3. Git Identity: `developertdsl-prog <developer.tdsl@gmail.com>`
4. SSH Key: `~/.ssh/id_rsa`
5. Remote URL: `git@github.com:developertdsl-prog/CRM-Lead-Management-System.git`
6. Branches Schedule (All branches pushed to GitHub with Foundation Base):
   - Day 1: `feature/foundation-and-architecture` (DONE & PUSHED)
   - Day 2: `feature/auth-and-tenancy` (PUSHED & READY FOR CODE)
   - Day 3: `feature/lead-lifecycle-and-import` (PUSHED & READY FOR CODE)
   - Day 4: `feature/contacts-companies-accounts` (PUSHED & READY FOR CODE)
   - Day 5: `feature/sales-pipeline-kanban-deals` (PUSHED & READY FOR CODE)
   - Day 6: `feature/activities-tasks-productivity` (PUSHED & READY FOR CODE)
   - Day 7: `feature/automations-reports-analytics` (PUSHED & READY FOR CODE)
7. Master Code Store: `backup/all-features-code` local branch holds the entire system implementation.
8. Zero `.env` push policy is strictly enforced.
