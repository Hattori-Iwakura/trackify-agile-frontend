import { useQuery } from '@tanstack/react-query';
import { sprintsApi } from '../api/sprints.api';

export function useSprint(projectId: string, sprintId: string) {
  return useQuery({
    queryKey: ['sprint', projectId, sprintId],
    queryFn: () => sprintsApi.findOne(projectId, sprintId),
    enabled: !!projectId && !!sprintId,
  });
}
