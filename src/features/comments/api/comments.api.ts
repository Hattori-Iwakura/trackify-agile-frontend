import { apiClient } from '@/shared/lib/api-client';
import type { Comment } from '@/shared/types';

export interface CreateCommentRequest {
  content: string;
  parentId?: string;
}

export interface UpdateCommentRequest {
  content: string;
}

export const commentsApi = {
  create: (projectId: string, issueKey: string, data: CreateCommentRequest) =>
    apiClient<Comment>(`/projects/${projectId}/issues/${issueKey}/comments`, {
      method: 'POST',
      body: data,
    }),

  findAll: (projectId: string, issueKey: string) =>
    apiClient<Comment[]>(`/projects/${projectId}/issues/${issueKey}/comments`),

  update: (projectId: string, issueKey: string, commentId: string, data: UpdateCommentRequest) =>
    apiClient<Comment>(`/projects/${projectId}/issues/${issueKey}/comments/${commentId}`, {
      method: 'PATCH',
      body: data,
    }),

  delete: (projectId: string, issueKey: string, commentId: string) =>
    apiClient<void>(`/projects/${projectId}/issues/${issueKey}/comments/${commentId}`, {
      method: 'DELETE',
    }),
};
