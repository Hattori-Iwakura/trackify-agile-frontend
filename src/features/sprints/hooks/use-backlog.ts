import { useQuery } from '@tanstack/react-query';
import { sprintsApi } from '../api/sprints.api';

export function useBacklog(projectId: string) {
  return useQuery({
    queryKey: ['backlog', projectId],
    queryFn: () => sprintsApi.getBacklog(projectId),
    enabled: !!projectId,
  });
}
