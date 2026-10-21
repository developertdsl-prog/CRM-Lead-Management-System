import { PrismaClient, UserRole, LeadStatus, LeadPriority, LeadSource, DealStatus, ActivityType, ActivityStatus, ActivityPriority, CustomFieldType, EntityType, AuditAction } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting CRM database seeding...');

  // Clean existing records if any
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.recordTag.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.stage.deleteMany();
  await prisma.pipeline.deleteMany();
  await prisma.account.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.company.deleteMany();
  await prisma.leadStatusHistory.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.teamMembership.deleteMany();
  await prisma.team.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.customFieldValue.deleteMany();
  await prisma.customFieldDefinition.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  // 1. Seed Organization
  const org = await prisma.organization.create({
    data: {
      name: 'Acme Global Corporation',
      slug: 'acme-global',
      domain: 'acme.com',
      currency: 'USD',
      timezone: 'America/New_York',
      settings: {
        fiscalYearStart: 'January',
        leadScoreThreshold: 60,
        enableAutoAssignment: true,
      },
    },
  });
  console.log(`✅ Created Organization: ${org.name} (${org.id})`);

  // 2. Hash Seed Password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('AdminStrongPassword!123', salt);

  // 3. Seed Users & Memberships
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@crmenterprise.com',
      passwordHash,
      firstName: 'Jonathan',
      lastName: 'Vance',
      phone: '+1-555-0199',
      isActive: true,
      isEmailVerified: true,
      memberships: {
        create: {
          organizationId: org.id,
          role: UserRole.OWNER,
          jobTitle: 'VP of Global Operations',
          department: 'Executive',
        },
      },
    },
  });

  const managerUser = await prisma.user.create({
    data: {
      email: 'sarah.manager@acme.com',
      passwordHash,
      firstName: 'Sarah',
      lastName: 'Jenkins',
      phone: '+1-555-0144',
      isActive: true,
      isEmailVerified: true,
      memberships: {
        create: {
          organizationId: org.id,
          role: UserRole.MANAGER,
          jobTitle: 'Sales Director',
          department: 'Sales',
        },
      },
    },
  });

  const salesRepUser = await prisma.user.create({
    data: {
      email: 'alex.sales@acme.com',
      passwordHash,
      firstName: 'Alex',
      lastName: 'Chen',
      phone: '+1-555-0182',
      isActive: true,
      isEmailVerified: true,
      memberships: {
        create: {
          organizationId: org.id,
          role: UserRole.SALES_REP,
          jobTitle: 'Senior Account Executive',
          department: 'Direct Sales',
        },
      },
    },
  });

  console.log('✅ Created Seed Users: Admin, Manager, Sales Rep');

  // 4. Seed Pipelines and Stages
  const pipeline = await prisma.pipeline.create({
    data: {
      organizationId: org.id,
      name: 'Standard B2B Sales Pipeline',
      isDefault: true,
      stages: {
        create: [
          { name: 'Qualification', order: 1, winProbability: 10, color: '#94A3B8' },
          { name: 'Discovery & Needs Analysis', order: 2, winProbability: 25, color: '#38BDF8' },
          { name: 'Proposal / Demo', order: 3, winProbability: 50, color: '#818CF8' },
          { name: 'Negotiation & Legal', order: 4, winProbability: 75, color: '#F59E0B' },
          { name: 'Closed Won', order: 5, winProbability: 100, color: '#10B981' },
          { name: 'Closed Lost', order: 6, winProbability: 0, color: '#EF4444' },
        ],
      },
    },
    include: { stages: true },
  });
  console.log(`✅ Created Pipeline: ${pipeline.name} with ${pipeline.stages.length} stages`);

  // 5. Seed Tags
  const enterpriseTag = await prisma.tag.create({
    data: { organizationId: org.id, name: 'Enterprise', color: '#6366F1' },
  });
  const urgentTag = await prisma.tag.create({
    data: { organizationId: org.id, name: 'Hot Lead', color: '#EF4444' },
  });

  // 6. Seed Custom Field Definitions
  await prisma.customFieldDefinition.create({
    data: {
      organizationId: org.id,
      entityType: EntityType.LEAD,
      fieldName: 'budgetRange',
      fieldLabel: 'Estimated Budget',
      fieldType: CustomFieldType.SELECT,
      options: ['< $25k', '$25k - $50k', '$50k - $100k', '> $100k'],
    },
  });

  // 7. Seed Companies
  const apexCorp = await prisma.company.create({
    data: {
      organizationId: org.id,
      name: 'Apex Robotics Inc.',
      domain: 'apexrobotics.io',
      industry: 'Industrial Automation',
      size: '250-500 employees',
      annualRevenue: 45000000,
      website: 'https://apexrobotics.io',
      phone: '+1-415-555-8291',
      city: 'San Francisco',
      state: 'CA',
      country: 'USA',
      ownerId: salesRepUser.id,
    },
  });

  const nexusHealth = await prisma.company.create({
    data: {
      organizationId: org.id,
      name: 'Nexus Healthcare Systems',
      domain: 'nexushealth.org',
      industry: 'Healthcare Technology',
      size: '1000+ employees',
      annualRevenue: 120000000,
      website: 'https://nexushealth.org',
      phone: '+1-617-555-9011',
      city: 'Boston',
      state: 'MA',
      country: 'USA',
      ownerId: salesRepUser.id,
    },
  });

  // 8. Seed Contacts
  const contactMarcus = await prisma.contact.create({
    data: {
      organizationId: org.id,
      companyId: apexCorp.id,
      firstName: 'Marcus',
      lastName: 'Sterling',
      email: 'msterling@apexrobotics.io',
      phone: '+1-415-555-8292',
      jobTitle: 'Chief Technology Officer',
      department: 'Engineering',
      isPrimary: true,
    },
  });

  const contactElena = await prisma.contact.create({
    data: {
      organizationId: org.id,
      companyId: nexusHealth.id,
      firstName: 'Dr. Elena',
      lastName: 'Rostova',
      email: 'erostova@nexushealth.org',
      phone: '+1-617-555-9012',
      jobTitle: 'Director of Clinical Informatics',
      department: 'Operations',
      isPrimary: true,
    },
  });

  // 9. Seed Leads
  const lead1 = await prisma.lead.create({
    data: {
      organizationId: org.id,
      firstName: 'Devon',
      lastName: 'Miles',
      email: 'devon@cloudmatrix.com',
      phone: '+1-212-555-3920',
      jobTitle: 'VP of Procurement',
      companyName: 'CloudMatrix Solutions',
      source: LeadSource.WEBSITE,
      status: LeadStatus.QUALIFIED,
      priority: LeadPriority.HIGH,
      score: 85,
      estimatedValue: 48000,
      ownerId: salesRepUser.id,
      recordTags: {
        create: [{ tagId: urgentTag.id }, { tagId: enterpriseTag.id }],
      },
      statusHistory: {
        create: [
          { oldStatus: LeadStatus.NEW, newStatus: LeadStatus.CONTACTED, changedById: salesRepUser.id, note: 'Introductory discovery call completed' },
          { oldStatus: LeadStatus.CONTACTED, newStatus: LeadStatus.QUALIFIED, changedById: salesRepUser.id, note: 'Confirmed BANT criteria and budget authority' },
        ],
      },
    },
  });

  await prisma.lead.create({
    data: {
      organizationId: org.id,
      firstName: 'Claire',
      lastName: 'O\'Connor',
      email: 'claire@fintechvanguard.co',
      phone: '+1-312-555-6612',
      jobTitle: 'Chief Risk Officer',
      companyName: 'Fintech Vanguard',
      source: LeadSource.REFERRAL,
      status: LeadStatus.NEW,
      priority: LeadPriority.MEDIUM,
      score: 55,
      estimatedValue: 32000,
      ownerId: salesRepUser.id,
    },
  });

  await prisma.lead.create({
    data: {
      organizationId: org.id,
      firstName: 'Liam',
      lastName: 'Gupta',
      email: 'liam@aegisaero.com',
      phone: '+1-206-555-4819',
      jobTitle: 'Head of Quality Assurance',
      companyName: 'Aegis Aerospace',
      source: LeadSource.LINKEDIN,
      status: LeadStatus.CONTACTED,
      priority: LeadPriority.URGENT,
      score: 92,
      estimatedValue: 120000,
      ownerId: salesRepUser.id,
    },
  });

  console.log('✅ Created Seed Leads');

  // 10. Seed Deals
  const stageProposal = pipeline.stages.find((s) => s.name === 'Proposal / Demo') || pipeline.stages[2];
  const stageNegotiation = pipeline.stages.find((s) => s.name === 'Negotiation & Legal') || pipeline.stages[3];

  await prisma.deal.create({
    data: {
      organizationId: org.id,
      title: 'Apex Robotics - Enterprise Automation Suite',
      amount: 95000,
      currency: 'USD',
      status: DealStatus.OPEN,
      pipelineId: pipeline.id,
      stageId: stageProposal.id,
      companyId: apexCorp.id,
      contactId: contactMarcus.id,
      ownerId: salesRepUser.id,
      expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.deal.create({
    data: {
      organizationId: org.id,
      title: 'Nexus Healthcare - Compliance Platform Rollout',
      amount: 140000,
      currency: 'USD',
      status: DealStatus.OPEN,
      pipelineId: pipeline.id,
      stageId: stageNegotiation.id,
      companyId: nexusHealth.id,
      contactId: contactElena.id,
      ownerId: salesRepUser.id,
      expectedCloseDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });
  console.log('✅ Created Seed Deals');

  // 11. Seed Activities
  await prisma.activity.create({
    data: {
      organizationId: org.id,
      type: ActivityType.CALL,
      title: 'Follow-up Call: Contract terms review',
      description: 'Discuss SLA terms and multi-year payment discount schedule with Dr. Elena.',
      status: ActivityStatus.PENDING,
      priority: ActivityPriority.HIGH,
      dueAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      assignedToId: salesRepUser.id,
      createdById: managerUser.id,
      companyId: nexusHealth.id,
      contactId: contactElena.id,
    },
  });

  await prisma.activity.create({
    data: {
      organizationId: org.id,
      type: ActivityType.TASK,
      title: 'Prepare revised technical demonstration for Devon',
      description: 'Highlight role-based permissions and audit logs for CloudMatrix compliance team.',
      status: ActivityStatus.PENDING,
      priority: ActivityPriority.MEDIUM,
      dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      assignedToId: salesRepUser.id,
      createdById: salesRepUser.id,
      leadId: lead1.id,
    },
  });

  // 12. Seed Audit Log
  await prisma.auditLog.create({
    data: {
      organizationId: org.id,
      userId: adminUser.id,
      action: AuditAction.CREATE,
      entityType: 'ORGANIZATION',
      entityId: org.id,
      ipAddress: '127.0.0.1',
      userAgent: 'SeedScript/1.0',
      changes: { name: org.name, slug: org.slug },
    },
  });

  console.log('✅ Seed data successfully populated!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
