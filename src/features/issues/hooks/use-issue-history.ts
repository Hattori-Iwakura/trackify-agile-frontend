import { useQuery } from '@tanstack/react-query';
import { issueHistoryApi } from '../api/issue-history.api';

export function useIssueHistory(projectId: string, issueKey: string) {
  return useQuery({
    queryKey: ['issue-history', projectId, issueKey],
    queryFn: () => issueHistoryApi.getHistory(projectId, issueKey),
    enabled: !!projectId && !!issueKey,
  });
}
