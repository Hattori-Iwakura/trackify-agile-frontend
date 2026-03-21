import { useQuery } from '@tanstack/react-query';
import { issuesApi, type QueryIssuesParams } from '../api/issues.api';

export function useIssues(projectId: string, params: QueryIssuesParams = {}) {
  return useQuery({
    queryKey: ['issues', projectId, params],
    queryFn: () => issuesApi.findAll(projectId, params),
    enabled: !!projectId,
  });
}
