import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { issueLinksApi, type CreateIssueLinkRequest } from '../api/issue-links.api';

export function useIssueLinks(projectId: string, issueKey: string) {
  return useQuery({
    queryKey: ['issue-links', projectId, issueKey],
    queryFn: () => issueLinksApi.getLinks(projectId, issueKey),
    enabled: !!projectId && !!issueKey,
  });
}

export function useCreateIssueLink(projectId: string, issueKey: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateIssueLinkRequest) =>
      issueLinksApi.create(projectId, issueKey, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issue-links', projectId, issueKey] });
    },
  });
}

export function useRemoveIssueLink(projectId: string, issueKey: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (linkId: string) =>
      issueLinksApi.remove(projectId, issueKey, linkId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issue-links', projectId, issueKey] });
    },
  });
}
