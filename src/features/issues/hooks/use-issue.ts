import { useQuery } from '@tanstack/react-query';
import { issuesApi } from '../api/issues.api';

export function useIssue(projectId: string, issueKey: string) {
  return useQuery({
    queryKey: ['issue', projectId, issueKey],
    queryFn: () => issuesApi.findOne(projectId, issueKey),
    enabled: !!projectId && !!issueKey,
  });
}
