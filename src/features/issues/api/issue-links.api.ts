import { apiClient } from '@/shared/lib/api-client';
import type { IssueLinksData, IssueLink, IssueLinkType } from '@/shared/types';

export interface CreateIssueLinkRequest {
  targetIssueKey: string;
  linkType: IssueLinkType;
}

export const issueLinksApi = {
  getLinks: (projectId: string, issueKey: string) =>
    apiClient<IssueLinksData>(`/projects/${projectId}/issues/${issueKey}/links`),

  create: (projectId: string, issueKey: string, data: CreateIssueLinkRequest) =>
    apiClient<IssueLink>(`/projects/${projectId}/issues/${issueKey}/links`, {
      method: 'POST',
      body: data,
    }),

  remove: (projectId: string, issueKey: string, linkId: string) =>
    apiClient<void>(`/projects/${projectId}/issues/${issueKey}/links/${linkId}`, {
      method: 'DELETE',
    }),
};
