import { apiClient } from '@/shared/lib/api-client';
import type { Label, PaginatedResult } from '@/shared/types';

export interface CreateLabelRequest { name: string; color: string; }
export interface UpdateLabelRequest { name?: string; color?: string; }

export const labelsApi = {
  create: (projectId: string, data: CreateLabelRequest) =>
    apiClient<Label>(`/projects/${projectId}/labels`, { method: 'POST', body: data }),
  findAll: (projectId: string, page = 1, limit = 50) =>
    apiClient<PaginatedResult<Label>>(`/projects/${projectId}/labels?page=${page}&limit=${limit}`),
  update: (projectId: string, labelId: string, data: UpdateLabelRequest) =>
    apiClient<Label>(`/projects/${projectId}/labels/${labelId}`, { method: 'PATCH', body: data }),
  delete: (projectId: string, labelId: string) =>
    apiClient<void>(`/projects/${projectId}/labels/${labelId}`, { method: 'DELETE' }),
};
