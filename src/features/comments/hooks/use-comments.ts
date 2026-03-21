import { useQuery } from '@tanstack/react-query';
import { commentsApi } from '../api/comments.api';

export function useComments(projectId: string, issueKey: string) {
  return useQuery({
    queryKey: ['comments', projectId, issueKey],
    queryFn: () => commentsApi.findAll(projectId, issueKey),
    enabled: !!projectId && !!issueKey,
  });
}
