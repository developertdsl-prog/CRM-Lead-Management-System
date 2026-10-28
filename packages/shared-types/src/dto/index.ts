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
import { IUser, IOrganization, ILead, IDeal, ICompany, IContact, IAccount, IPipeline, IStage } from '../models/index.js';


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

// Pipeline & Stage DTOs
export interface CreateStageDto {
  name: string;
  order?: number;
  winProbability?: number;
  color?: string;
}

export interface UpdateStageDto extends Partial<CreateStageDto> {}

export interface ReorderStagesDto {
  stageOrders: Array<{ id: string; order: number }>;
}

export interface CreatePipelineDto {
  name: string;
  isDefault?: boolean;
  stages?: CreateStageDto[];
}

export interface UpdatePipelineDto {
  name?: string;
  isDefault?: boolean;
}

export interface PipelineSummaryDto extends IPipeline {
  dealCount: number;
  totalDealValue: number;
  stages: Array<IStage & { dealCount: number; totalDealValue: number }>;
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
  customFields?: Record<string, unknown>;
}

export interface UpdateDealDto extends Partial<CreateDealDto> {
  status?: DealStatus;
  lostReason?: string;
}

export interface ChangeDealStageDto {
  stageId: string;
  status?: DealStatus;
  lostReason?: string;
}

export interface DealQueryDto extends PaginationParams {
  pipelineId?: string;
  stageId?: string;
  status?: DealStatus;
  ownerId?: string;
  companyId?: string;
  contactId?: string;
  search?: string;
}

export interface DealForecastStageBreakdown {
  id: string;
  name: string;
  order: number;
  winProbability: number;
  color: string;
  dealCount: number;
  totalAmount: number;
  weightedAmount: number;
}

export interface PipelineForecastSummaryDto {
  totalDeals: number;
  totalPipelineValue: number;
  weightedForecastValue: number;
  wonDealsCount: number;
  wonDealsValue: number;
  lostDealsCount: number;
  lostDealsValue: number;
  openDealsCount: number;
  winRate: number;
  averageDealSize: number;
  stageBreakdown: DealForecastStageBreakdown[];
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

// Contact DTOs
export interface CreateContactDto {
  companyId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  mobilePhone?: string;
  jobTitle?: string;
  department?: string;
  isPrimary?: boolean;
}

export interface UpdateContactDto extends Partial<CreateContactDto> {}

export interface ContactStatsDto {
  totalContacts: number;
  primaryContacts: number;
  contactsWithCompany: number;
}

// Custom Fields DTOs
export interface CreateCustomFieldDefinitionDto {
  entityType: EntityType;
  fieldName: string;
  fieldLabel: string;
  fieldType: CustomFieldType;
  isRequired?: boolean;
  options?: string[];
  defaultValue?: string;
}

export interface UpdateCustomFieldDefinitionDto extends Partial<CreateCustomFieldDefinitionDto> {}

export interface CustomFieldValueDto {
  definitionId: string;
  fieldName: string;
  fieldLabel: string;
  fieldType: CustomFieldType;
  isRequired: boolean;
  options?: string[];
  value: unknown;
}

export interface BatchSetCustomFieldsDto {
  fields: Record<string, unknown>;
}

// Notification DTOs (Phase 6)
export interface NotificationDto {
  id: string;
  organizationId: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  link?: string | null;
  isRead: boolean;
  createdAt: Date | string;
}

export interface NotificationSummaryDto {
  unreadCount: number;
  items: NotificationDto[];
}

export interface CreateNotificationDto {
  userId?: string;
  title: string;
  message: string;
  type?: string;
  link?: string;
}

// Automation DTOs (Phase 6)
export interface AutomationRuleDto {
  id: string;
  organizationId: string;
  name: string;
  description?: string | null;
  triggerEvent: string;
  conditions: Record<string, unknown>;
  actions: Array<{ type: string; params?: Record<string, unknown> }>;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  _count?: {
    executions: number;
  };
}

export interface CreateAutomationRuleDto {
  name: string;
  description?: string;
  triggerEvent: string;
  conditions?: Record<string, unknown>;
  actions: Array<{ type: string; params?: Record<string, unknown> }>;
  isActive?: boolean;
}

export interface UpdateAutomationRuleDto extends Partial<CreateAutomationRuleDto> {}

export interface AutomationExecutionDto {
  id: string;
  ruleId: string;
  ruleName?: string;
  entityType: string;
  entityId: string;
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
  error?: string | null;
  executionLog?: Record<string, unknown> | null;
  executedAt: Date | string;
}

// Analytics & Reports DTOs (Phase 6)
export interface AnalyticsOverviewDto {
  summary: {
    totalRevenue: number;
    weightedRevenue: number;
    totalDeals: number;
    wonDealsCount: number;
    winRate: number;
    activeLeadsCount: number;
    leadsConversionRate: number;
    completedActivitiesCount: number;
    overdueActivitiesCount: number;
  };
  leadsByStatus: Array<{ status: string; count: number; percentage: number }>;
  leadsBySource: Array<{ source: string; count: number }>;
  dealsByStage: Array<{
    stageId: string;
    stageName: string;
    winProbability: number;
    color: string;
    count: number;
    value: number;
  }>;
  recentActivityFeed: Array<{
    id: string;
    type: string;
    title: string;
    status: string;
    dueAt?: Date | string | null;
    createdAt: Date | string;
    assignedToName?: string;
  }>;
  monthlyRevenueTrends: Array<{
    month: string;
    revenue: number;
    dealCount: number;
  }>;
}



