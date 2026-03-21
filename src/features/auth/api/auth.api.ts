import { apiClient } from '@/shared/lib/api-client';
import type { User } from '@/shared/types';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient<LoginResponse>('/auth/login', { method: 'POST', body: data }),

  register: (data: RegisterRequest) =>
    apiClient<User>('/auth/register', { method: 'POST', body: data }),

  logout: () =>
    apiClient<void>('/auth/logout', { method: 'POST' }),

  getMe: () =>
    apiClient<User>('/users/me'),
};
