import {
  UserRole,
  MembershipStatus,
  LeadStatus,
  LeadPriority,
  LeadSource,
  DealStatus,
  ActivityType,
  ActivityStatus,
  ActivityPriority,
  CustomFieldType,
  EntityType,
  NotificationType,
  AuditAction,
} from '../enums/index.js';

export interface IOrganization {
  id: string;
  name: string;
  slug: string;
  domain?: string | null;
  logoUrl?: string | null;
  currency: string;
  timezone: string;
  settings?: Record<string, unknown> | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface IUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  phone?: string | null;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface IMembership {
  id: string;
  organizationId: string;
  userId: string;
  role: UserRole;
  jobTitle?: string | null;
  department?: string | null;
  status: MembershipStatus;
  user?: IUser;
  organization?: IOrganization;
}

export interface ILead {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  jobTitle?: string | null;
  companyName?: string | null;
  source: LeadSource;
  status: LeadStatus;
  priority: LeadPriority;
  score: number;
  estimatedValue?: number | null;
  currency: string;
  ownerId?: string | null;
  lostReason?: string | null;
  convertedAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ICompany {
  id: string;
  organizationId: string;
  name: string;
  domain?: string | null;
  industry?: string | null;
  size?: string | null;
  annualRevenue?: number | null;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  ownerId?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface IContact {
  id: string;
  organizationId: string;
  companyId?: string | null;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  jobTitle?: string | null;
  department?: string | null;
  isPrimary: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface IPipeline {
  id: string;
  organizationId: string;
  name: string;
  isDefault: boolean;
  stages?: IStage[];
}

export interface IStage {
  id: string;
  pipelineId: string;
  name: string;
  order: number;
  winProbability: number;
  color?: string | null;
}

export interface IDeal {
  id: string;
  organizationId: string;
  title: string;
  amount: number;
  currency: string;
  status: DealStatus;
  pipelineId: string;
  stageId: string;
  companyId?: string | null;
  contactId?: string | null;
  leadId?: string | null;
  ownerId?: string | null;
  expectedCloseDate?: Date | string | null;
  actualCloseDate?: Date | string | null;
  lostReason?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface IActivity {
  id: string;
  organizationId: string;
  type: ActivityType;
  title: string;
  description?: string | null;
  status: ActivityStatus;
  priority: ActivityPriority;
  dueAt?: Date | string | null;
  completedAt?: Date | string | null;
  durationMinutes?: number | null;
  outcome?: string | null;
  assignedToId?: string | null;
  createdById: string;
  leadId?: string | null;
  contactId?: string | null;
  companyId?: string | null;
  dealId?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface INotification {
  id: string;
  organizationId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: Date | string;
}

export interface IAuditLog {
  id: string;
  organizationId: string;
  userId?: string | null;
  action: AuditAction;
  entityType: EntityType | string;
  entityId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  changes?: Record<string, unknown> | null;
  createdAt: Date | string;
}
