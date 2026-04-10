import { useQuery } from '@tanstack/react-query';
import { issuesApi } from '../api/issues.api';

export function useBoard(projectId: string) {
  return useQuery({
    queryKey: ['board', projectId],
    queryFn: () => issuesApi.getBoard(projectId),
    enabled: !!projectId,
  });
}
