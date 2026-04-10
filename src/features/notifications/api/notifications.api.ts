import { apiClient } from '@/shared/lib/api-client';
import type { Notification, PaginatedResult } from '@/shared/types';

export const notificationsApi = {
  findAll: (page = 1, limit = 20) =>
    apiClient<PaginatedResult<Notification>>(`/notifications?page=${page}&limit=${limit}`),

  getUnreadCount: () =>
    apiClient<number>('/notifications/unread-count'),

  markAsRead: (id: string) =>
    apiClient<Notification>(`/notifications/${id}/read`, { method: 'PATCH' }),

  markAllAsRead: () =>
    apiClient<void>('/notifications/read-all', { method: 'PATCH' }),
};
