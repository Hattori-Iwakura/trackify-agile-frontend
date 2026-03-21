import { apiClient } from '@/shared/lib/api-client';
import type { User } from '@/shared/types';

export interface UpdateProfileRequest { fullName?: string; email?: string; }

export const usersApi = {
  getMe: () => apiClient<User>('/users/me'),
  updateProfile: (data: UpdateProfileRequest) =>
    apiClient<User>('/users/me', { method: 'PATCH', body: data }),
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return apiClient<User>('/users/me/avatar', { method: 'POST', body: formData });
  },
};
