import { useMutation, useQueryClient } from '@tanstack/react-query';
import { issuesApi, type CreateIssueRequest, type UpdateIssueRequest } from '../api/issues.api';
import type { BoardData, IssueStatus } from '@/shared/types';

export function useCreateIssue(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateIssueRequest) => issuesApi.create(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', projectId] });
      queryClient.invalidateQueries({ queryKey: ['issues', projectId] });
      queryClient.invalidateQueries({ queryKey: ['backlog', projectId] });
    },
  });
}

export function useUpdateIssue(projectId: string, issueKey: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateIssueRequest) => issuesApi.update(projectId, issueKey, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issue', projectId, issueKey] });
      queryClient.invalidateQueries({ queryKey: ['board', projectId] });
    },
  });
}

export function useUpdateIssueStatus(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ issueKey, status }: { issueKey: string; status: IssueStatus }) =>
      issuesApi.updateStatus(projectId, issueKey, status),
    onMutate: async ({ issueKey, status }) => {
      await queryClient.cancelQueries({ queryKey: ['board', projectId] });
      const previousBoard = queryClient.getQueryData<BoardData>(['board', projectId]);
      if (previousBoard) {
        const newBoard = { ...previousBoard };
        let movedIssue = null;
        // Remove from old column
        for (const col of Object.keys(newBoard)) {
          const idx = newBoard[col]?.findIndex((i) => i.issueKey === issueKey);
          if (idx !== undefined && idx >= 0 && newBoard[col]) {
            movedIssue = { ...newBoard[col][idx], status };
            newBoard[col] = newBoard[col].filter((_, i) => i !== idx);
            break;
          }
        }
        // Add to new column
        if (movedIssue) {
          if (!newBoard[status]) newBoard[status] = [];
          newBoard[status] = [...newBoard[status], movedIssue];
        }
        queryClient.setQueryData(['board', projectId], newBoard);
      }
      return { previousBoard };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(['board', projectId], context.previousBoard);
      }
      queryClient.invalidateQueries({ queryKey: ['board', projectId] });
    },
  });
}

export function useReorderIssue(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ issueKey, status, position }: { issueKey: string; status: IssueStatus; position: number }) =>
      issuesApi.reorder(projectId, issueKey, status, position),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['board', projectId] });
    },
  });
}

export function useDeleteIssue(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (issueKey: string) => issuesApi.delete(projectId, issueKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', projectId] });
      queryClient.invalidateQueries({ queryKey: ['issues', projectId] });
    },
  });
}

export function useAddLabelToIssue(projectId: string, issueKey: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (labelId: string) => issuesApi.addLabel(projectId, issueKey, labelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issue', projectId, issueKey] });
    },
  });
}

export function useRemoveLabelFromIssue(projectId: string, issueKey: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (labelId: string) => issuesApi.removeLabel(projectId, issueKey, labelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issue', projectId, issueKey] });
    },
  });
}
