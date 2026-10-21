'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { apiRequest } from '@/lib/api-client';
import { AuthResponseData, LoginDto, RegisterDto } from '@crm/shared-types';

interface AuthContextType {
  user: AuthResponseData['user'] | null;
  organization: AuthResponseData['organization'] | null;
  role: string | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginDto) => Promise<void>;
  register: (data: RegisterDto) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthResponseData['user'] | null>(null);
  const [organization, setOrganization] = useState<AuthResponseData['organization'] | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('crm_access_token');
      const storedUser = localStorage.getItem('crm_user');
      const storedOrg = localStorage.getItem('crm_org');
      const storedRole = localStorage.getItem('crm_role');

      if (storedToken && storedUser && storedOrg) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setOrganization(JSON.parse(storedOrg));
        setRole(storedRole);
      }
    } catch (e) {
      console.error('Failed to restore auth session:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (credentials: LoginDto) => {
    setIsLoading(true);
    try {
      const data = await apiRequest<AuthResponseData>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      localStorage.setItem('crm_access_token', data.tokens.accessToken);
      localStorage.setItem('crm_refresh_token', data.tokens.refreshToken);
      localStorage.setItem('crm_user', JSON.stringify(data.user));
      localStorage.setItem('crm_org', JSON.stringify(data.organization));
      localStorage.setItem('crm_org_id', data.organization.id);
      localStorage.setItem('crm_role', data.role);

      setToken(data.tokens.accessToken);
      setUser(data.user);
      setOrganization(data.organization);
      setRole(data.role);

      toast.success(`Welcome back, ${data.user.firstName}!`);
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Login failed. Please check your credentials.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterDto) => {
    setIsLoading(true);
    try {
      const resData = await apiRequest<AuthResponseData>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      localStorage.setItem('crm_access_token', resData.tokens.accessToken);
      localStorage.setItem('crm_refresh_token', resData.tokens.refreshToken);
      localStorage.setItem('crm_user', JSON.stringify(resData.user));
      localStorage.setItem('crm_org', JSON.stringify(resData.organization));
      localStorage.setItem('crm_org_id', resData.organization.id);
      localStorage.setItem('crm_role', resData.role);

      setToken(resData.tokens.accessToken);
      setUser(resData.user);
      setOrganization(resData.organization);
      setRole(resData.role);

      toast.success('Organization created successfully!');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Registration failed.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('crm_access_token');
    localStorage.removeItem('crm_refresh_token');
    localStorage.removeItem('crm_user');
    localStorage.removeItem('crm_org');
    localStorage.removeItem('crm_org_id');
    localStorage.removeItem('crm_role');

    setToken(null);
    setUser(null);
    setOrganization(null);
    setRole(null);

    toast.info('Logged out successfully');
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        role,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
