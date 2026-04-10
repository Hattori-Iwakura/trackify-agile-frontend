import { apiClient } from '@/shared/lib/api-client';
import type { Issue, BoardData, PaginatedResult, IssueStatus } from '@/shared/types';

export interface CreateIssueRequest {
  title: string;
  description?: string;
  priority?: string;
  type?: string;
  assigneeId?: string;
  labelIds?: string[];
}

export interface UpdateIssueRequest {
  title?: string;
  description?: string;
  priority?: string;
  type?: string;
  assigneeId?: string | null;
}

export interface QueryIssuesParams {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  type?: string;
  assigneeId?: string;
  search?: string;
}

export const issuesApi = {
  create: (projectId: string, data: CreateIssueRequest) =>
    apiClient<Issue>(`/projects/${projectId}/issues`, { method: 'POST', body: data }),
  findAll: (projectId: string, params: QueryIssuesParams = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) searchParams.set(key, String(value));
    });
    return apiClient<PaginatedResult<Issue>>(`/projects/${projectId}/issues?${searchParams}`);
  },
  getBoard: (projectId: string) =>
    apiClient<BoardData>(`/projects/${projectId}/issues/board`),
  findOne: (projectId: string, issueKey: string) =>
    apiClient<Issue>(`/projects/${projectId}/issues/${issueKey}`),
  update: (projectId: string, issueKey: string, data: UpdateIssueRequest) =>
    apiClient<Issue>(`/projects/${projectId}/issues/${issueKey}`, { method: 'PATCH', body: data }),
  updateStatus: (projectId: string, issueKey: string, status: IssueStatus) =>
    apiClient<Issue>(`/projects/${projectId}/issues/${issueKey}/status`, { method: 'PATCH', body: { status } }),
  reorder: (projectId: string, issueKey: string, status: IssueStatus, position: number) =>
    apiClient<Issue>(`/projects/${projectId}/issues/${issueKey}/reorder`, { method: 'PATCH', body: { status, position } }),
  addLabel: (projectId: string, issueKey: string, labelId: string) =>
    apiClient<Issue>(`/projects/${projectId}/issues/${issueKey}/labels/${labelId}`, { method: 'POST' }),
  removeLabel: (projectId: string, issueKey: string, labelId: string) =>
    apiClient<Issue>(`/projects/${projectId}/issues/${issueKey}/labels/${labelId}`, { method: 'DELETE' }),
  delete: (projectId: string, issueKey: string) =>
    apiClient<void>(`/projects/${projectId}/issues/${issueKey}`, { method: 'DELETE' }),
};
