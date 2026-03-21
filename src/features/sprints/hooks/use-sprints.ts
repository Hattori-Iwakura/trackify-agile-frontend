import { useQuery } from '@tanstack/react-query';
import { sprintsApi } from '../api/sprints.api';

export function useSprints(projectId: string) {
  return useQuery({
    queryKey: ['sprints', projectId],
    queryFn: () => sprintsApi.findAll(projectId),
    enabled: !!projectId,
  });
}
