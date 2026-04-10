import { apiClient } from '@/shared/lib/api-client';
import type { ProjectMember, ProjectRole, PaginatedResult } from '@/shared/types';

export interface AddMemberRequest {
  userId: string;
  role?: ProjectRole;
}

export const membersApi = {
  addMember: (projectId: string, data: AddMemberRequest) =>
    apiClient<ProjectMember>(`/projects/${projectId}/members`, { method: 'POST', body: data }),
  findAll: (projectId: string, page = 1, limit = 20) =>
    apiClient<PaginatedResult<ProjectMember>>(`/projects/${projectId}/members?page=${page}&limit=${limit}`),
  updateRole: (projectId: string, userId: string, role: ProjectRole) =>
    apiClient<ProjectMember>(`/projects/${projectId}/members/${userId}`, { method: 'PATCH', body: { role } }),
  leave: (projectId: string) =>
    apiClient<void>(`/projects/${projectId}/members/me`, { method: 'DELETE' }),
  removeMember: (projectId: string, userId: string) =>
    apiClient<void>(`/projects/${projectId}/members/${userId}`, { method: 'DELETE' }),
};
