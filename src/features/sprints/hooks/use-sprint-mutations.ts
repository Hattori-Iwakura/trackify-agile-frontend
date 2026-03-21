import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sprintsApi, type CreateSprintRequest, type UpdateSprintRequest } from '../api/sprints.api';

export function useCreateSprint(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSprintRequest) => sprintsApi.create(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprints', projectId] });
      queryClient.invalidateQueries({ queryKey: ['backlog', projectId] });
    },
  });
}

export function useUpdateSprint(projectId: string, sprintId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateSprintRequest & { sprintId?: string }) => {
      const id = data.sprintId ?? sprintId;
      if (!id) throw new Error('sprintId is required');
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { sprintId: _sprintId, ...rest } = data;
      return sprintsApi.update(projectId, id, rest);
    },
    onSuccess: (_data, variables) => {
      const id = variables.sprintId ?? sprintId;
      queryClient.invalidateQueries({ queryKey: ['sprints', projectId] });
      queryClient.invalidateQueries({ queryKey: ['backlog', projectId] });
      if (id) {
        queryClient.invalidateQueries({ queryKey: ['sprint', projectId, id] });
      }
    },
  });
}

export function useDeleteSprint(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sprintId: string) => sprintsApi.delete(projectId, sprintId),
    onSuccess: (_data, sprintId) => {
      queryClient.invalidateQueries({ queryKey: ['sprints', projectId] });
      queryClient.invalidateQueries({ queryKey: ['backlog', projectId] });
      queryClient.invalidateQueries({ queryKey: ['sprint', projectId, sprintId] });
    },
  });
}

export function useStartSprint(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sprintId: string) => sprintsApi.start(projectId, sprintId),
    onSuccess: (_data, sprintId) => {
      queryClient.invalidateQueries({ queryKey: ['sprints', projectId] });
      queryClient.invalidateQueries({ queryKey: ['backlog', projectId] });
      queryClient.invalidateQueries({ queryKey: ['sprint', projectId, sprintId] });
    },
  });
}

export function useCompleteSprint(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sprintId: string) => sprintsApi.complete(projectId, sprintId),
    onSuccess: (_data, sprintId) => {
      queryClient.invalidateQueries({ queryKey: ['sprints', projectId] });
      queryClient.invalidateQueries({ queryKey: ['backlog', projectId] });
      queryClient.invalidateQueries({ queryKey: ['sprint', projectId, sprintId] });
    },
  });
}

export function useAddIssueToSprint(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sprintId, issueKey }: { sprintId: string; issueKey: string }) =>
      sprintsApi.addIssue(projectId, sprintId, issueKey),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['sprints', projectId] });
      queryClient.invalidateQueries({ queryKey: ['backlog', projectId] });
    },
  });
}

export function useRemoveIssueFromSprint(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sprintId, issueKey }: { sprintId: string; issueKey: string }) =>
      sprintsApi.removeIssue(projectId, sprintId, issueKey),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['sprints', projectId] });
      queryClient.invalidateQueries({ queryKey: ['backlog', projectId] });
    },
  });
}
