import { apiClient } from '@/shared/lib/api-client';
import type { Sprint, Issue } from '@/shared/types';

export interface CreateSprintRequest {
  name: string;
  goal?: string;
  startDate?: string;
  endDate?: string;
}

export interface UpdateSprintRequest {
  name?: string;
  goal?: string;
  startDate?: string;
  endDate?: string;
}

export const sprintsApi = {
  create: (projectId: string, data: CreateSprintRequest) =>
    apiClient<Sprint>(`/projects/${projectId}/sprints`, { method: 'POST', body: data }),

  findAll: (projectId: string) =>
    apiClient<Sprint[]>(`/projects/${projectId}/sprints`),

  findOne: (projectId: string, sprintId: string) =>
    apiClient<Sprint>(`/projects/${projectId}/sprints/${sprintId}`),

  update: (projectId: string, sprintId: string, data: UpdateSprintRequest) =>
    apiClient<Sprint>(`/projects/${projectId}/sprints/${sprintId}`, { method: 'PATCH', body: data }),

  delete: (projectId: string, sprintId: string) =>
    apiClient<void>(`/projects/${projectId}/sprints/${sprintId}`, { method: 'DELETE' }),

  start: (projectId: string, sprintId: string) =>
    apiClient<Sprint>(`/projects/${projectId}/sprints/${sprintId}/start`, { method: 'POST' }),

  complete: (projectId: string, sprintId: string) =>
    apiClient<Sprint>(`/projects/${projectId}/sprints/${sprintId}/complete`, { method: 'POST' }),

  getBacklog: (projectId: string) =>
    apiClient<Issue[]>(`/projects/${projectId}/backlog`),

  addIssue: (projectId: string, sprintId: string, issueKey: string) =>
    apiClient<Issue>(`/projects/${projectId}/sprints/${sprintId}/issues/${issueKey}`, { method: 'POST' }),

  removeIssue: (projectId: string, sprintId: string, issueKey: string) =>
    apiClient<Issue>(`/projects/${projectId}/sprints/${sprintId}/issues/${issueKey}`, { method: 'DELETE' }),
};
