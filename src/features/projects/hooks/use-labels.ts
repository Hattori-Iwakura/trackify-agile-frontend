import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { labelsApi, type CreateLabelRequest, type UpdateLabelRequest } from '../api/labels.api';

export function useLabels(projectId: string) {
  return useQuery({
    queryKey: ['labels', projectId],
    queryFn: () => labelsApi.findAll(projectId),
    enabled: !!projectId,
  });
}

export function useCreateLabel(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateLabelRequest) => labelsApi.create(projectId, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['labels', projectId] }); },
  });
}

export function useUpdateLabel(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ labelId, data }: { labelId: string; data: UpdateLabelRequest }) =>
      labelsApi.update(projectId, labelId, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['labels', projectId] }); },
  });
}

export function useDeleteLabel(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (labelId: string) => labelsApi.delete(projectId, labelId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['labels', projectId] }); },
  });
}
