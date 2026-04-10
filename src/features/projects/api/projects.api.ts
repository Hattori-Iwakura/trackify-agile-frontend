import { apiClient } from '@/shared/lib/api-client';
import type { Project, PaginatedResult } from '@/shared/types';

export interface CreateProjectRequest {
  name: string;
  key: string;
  description?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
}

export const projectsApi = {
  create: (data: CreateProjectRequest) =>
    apiClient<Project>('/projects', { method: 'POST', body: data }),
  findAll: (page = 1, limit = 10) =>
    apiClient<PaginatedResult<Project>>(`/projects?page=${page}&limit=${limit}`),
  findOne: (projectId: string) =>
    apiClient<Project>(`/projects/${projectId}`),
  update: (projectId: string, data: UpdateProjectRequest) =>
    apiClient<Project>(`/projects/${projectId}`, { method: 'PATCH', body: data }),
  delete: (projectId: string) =>
    apiClient<void>(`/projects/${projectId}`, { method: 'DELETE' }),
};
