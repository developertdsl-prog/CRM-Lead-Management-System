import { ApiResponse } from '@crm/shared-types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public errors?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('crm_access_token') : null;
  const orgId = typeof window !== 'undefined' ? localStorage.getItem('crm_org_id') : null;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(orgId ? { 'X-Organization-Id': orgId } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data: ApiResponse<T> = await response.json().catch(() => ({
    success: false,
    statusCode: response.status,
    message: response.statusText,
    data: null as unknown as T,
  }));

  if (!response.ok || !data.success) {
    throw new ApiError(
      response.status,
      data.message || 'An unexpected API error occurred',
      data.errors,
    );
  }

  return data.data;
}
