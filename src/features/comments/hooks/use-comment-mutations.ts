import { useMutation, useQueryClient } from '@tanstack/react-query';
import { commentsApi, type CreateCommentRequest, type UpdateCommentRequest } from '../api/comments.api';

export function useCreateComment(projectId: string, issueKey: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCommentRequest) => commentsApi.create(projectId, issueKey, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', projectId, issueKey] });
    },
  });
}

export function useUpdateComment(projectId: string, issueKey: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ commentId, data }: { commentId: string; data: UpdateCommentRequest }) =>
      commentsApi.update(projectId, issueKey, commentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', projectId, issueKey] });
    },
  });
}

export function useDeleteComment(projectId: string, issueKey: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => commentsApi.delete(projectId, issueKey, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', projectId, issueKey] });
    },
  });
}
