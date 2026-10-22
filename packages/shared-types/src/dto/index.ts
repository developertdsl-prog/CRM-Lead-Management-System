import {
  UserRole,
  LeadStatus,
  LeadPriority,
  LeadSource,
  DealStatus,
  ActivityType,
  ActivityStatus,
  ActivityPriority,
  CustomFieldType,
  EntityType,
} from '../enums/index.js';
import { IUser, IOrganization, ILead, IDeal, ICompany, IContact, IAccount } from '../models/index.js';

export interface ApiResponse<T = unknown> {
  success: boolean;
  statusCode: number;
  message?: string;
  errors?: unknown;
  data: T;
  meta?: {
    timestamp: string;
    requestId?: string;
    path?: string;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// Authentication DTOs
export interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationName: string;
  organizationSlug?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponseData {
  user: IUser;
  organization: IOrganization;
  role: UserRole;
  tokens: AuthTokens;
}

// Lead DTOs
export interface CreateLeadDto {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  companyName?: string;
  source?: LeadSource;
  status?: LeadStatus;
  priority?: LeadPriority;
  score?: number;
  estimatedValue?: number;
  currency?: string;
  ownerId?: string;
  customFields?: Record<string, unknown>;
}

export interface UpdateLeadDto extends Partial<CreateLeadDto> {
  lostReason?: string;
}

export interface ConvertLeadDto {
  createDeal?: boolean;
  dealTitle?: string;
  dealAmount?: number;
  pipelineId?: string;
  stageId?: string;
  expectedCloseDate?: string;
}

export interface CheckDuplicateDto {
  email?: string;
  phone?: string;
  companyName?: string;
  excludeLeadId?: string;
}

export interface DuplicateMatch {
  leadId: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  companyName?: string | null;
  status: LeadStatus;
  matchType: 'EMAIL_EXACT' | 'PHONE_EXACT' | 'COMPANY_NAME' | 'FUZZY';
  confidenceScore: number;
}

export interface DuplicateCheckResult {
  hasDuplicate: boolean;
  matches: DuplicateMatch[];
}

export interface ImportLeadsOptions {
  onDuplicate: 'SKIP' | 'UPDATE' | 'IMPORT_ANYWAY';
  defaultSource?: LeadSource;
  defaultStatus?: LeadStatus;
  defaultPriority?: LeadPriority;
}

export interface ImportLeadsResult {
  totalRows: number;
  imported: number;
  updated: number;
  skippedDuplicates: number;
  failed: number;
  errors: { row: number; reason: string; data?: Record<string, unknown> }[];
}

export interface LeadStatsDto {
  totalLeads: number;
  newLeads: number;
  contactedLeads: number;
  qualifiedLeads: number;
  unqualifiedLeads: number;
  convertedLeads: number;
  lostLeads: number;
  conversionRate: number;
  totalEstimatedValue: number;
}

export interface LeadTimelineItem {
  id: string;
  type: 'STATUS_CHANGE' | 'ACTIVITY' | 'CONVERSION' | 'CREATION';
  title: string;
  description?: string | null;
  oldStatus?: LeadStatus;
  newStatus?: LeadStatus;
  performedBy?: {
    id: string;
    name: string;
    email: string;
  } | null;
  timestamp: Date | string;
  metadata?: Record<string, unknown>;
}

// Deal DTOs
export interface CreateDealDto {
  title: string;
  amount: number;
  currency?: string;
  pipelineId: string;
  stageId: string;
  companyId?: string;
  contactId?: string;
  leadId?: string;
  ownerId?: string;
  expectedCloseDate?: string;
}

export interface UpdateDealDto extends Partial<CreateDealDto> {
  status?: DealStatus;
  lostReason?: string;
}

// Activity DTOs
export interface CreateActivityDto {
  type: ActivityType;
  title: string;
  description?: string;
  status?: ActivityStatus;
  priority?: ActivityPriority;
  dueAt?: string;
  durationMinutes?: number;
  assignedToId?: string;
  leadId?: string;
  contactId?: string;
  companyId?: string;
  dealId?: string;
}

// Dashboard Analytics DTO
export interface DashboardMetricsDto {
  totalLeads: number;
  newLeadsToday: number;
  qualifiedLeads: number;
  convertedLeads: number;
  leadConversionRate: number;
  openDealsCount: number;
  totalPipelineValue: number;
  wonDealsValue: number;
  overdueTasksCount: number;
  upcomingFollowUpsCount: number;
  leadsBySource: { source: string; count: number }[];
  leadsByStatus: { status: string; count: number }[];
}

// Company & Account DTOs
export interface CreateCompanyDto {
  name: string;
  domain?: string;
  industry?: string;
  size?: string;
  annualRevenue?: number;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  ownerId?: string;
}

export interface UpdateCompanyDto extends Partial<CreateCompanyDto> {}

export interface CreateAccountDto {
  companyId: string;
  customerStatus?: string;
  tier?: string;
  accountManagerId?: string;
  healthScore?: number;
  mrr?: number;
  contractStartDate?: string;
  contractEndDate?: string;
}

export interface UpdateAccountDto extends Partial<CreateAccountDto> {}

export interface Account360Dto {
  company: {
    id: string;
    name: string;
    domain?: string | null;
    industry?: string | null;
    size?: string | null;
    annualRevenue?: number | null;
    phone?: string | null;
    website?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    postalCode?: string | null;
    createdAt: Date | string;
    owner?: { id: string; firstName: string; lastName: string; email: string } | null;
  };
  account: {
    id: string;
    customerStatus: string;
    tier: string;
    healthScore: number;
    mrr: number;
    contractStartDate?: Date | string | null;
    contractEndDate?: Date | string | null;
    accountManager?: { id: string; firstName: string; lastName: string; email: string } | null;
  } | null;
  contacts: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
    jobTitle?: string | null;
    department?: string | null;
    isPrimary: boolean;
  }>;
  deals: {
    totalValue: number;
    count: number;
    items: Array<{
      id: string;
      title: string;
      amount: number;
      currency: string;
      status: DealStatus;
      stage: { id: string; name: string; color?: string | null };
      expectedCloseDate?: Date | string | null;
    }>;
  };
  activities: Array<{
    id: string;
    type: ActivityType;
    title: string;
    description?: string | null;
    status: ActivityStatus;
    dueAt?: Date | string | null;
    createdAt: Date | string;
    assignedTo?: { id: string; firstName: string; lastName: string } | null;
  }>;
  customFields?: Record<string, unknown>;
}

export interface CompanyStatsDto {
  totalCompanies: number;
  totalAccounts: number;
  activeAccounts: number;
  avgHealthScore: number;
  totalMrr: number;
}


