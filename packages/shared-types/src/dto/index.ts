import { UserRole, LeadStatus, LeadPriority, LeadSource, DealStatus, ActivityType, ActivityStatus, ActivityPriority } from '../enums/index.js';
import { IUser, IOrganization, ILead, IDeal } from '../models/index.js';

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
