import { apiClient } from '@/shared/lib/api-client';
import type { IssueHistory } from '@/shared/types';

export const issueHistoryApi = {
  getHistory: (projectId: string, issueKey: string) =>
    apiClient<IssueHistory[]>(`/projects/${projectId}/issues/${issueKey}/history`),
};
