import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attachmentsApi } from '../api/attachments.api';

export function useAttachments(projectId: string, issueKey: string) {
  return useQuery({
    queryKey: ['attachments', projectId, issueKey],
    queryFn: () => attachmentsApi.findAll(projectId, issueKey),
    enabled: !!projectId && !!issueKey,
  });
}

export function useUploadAttachment(projectId: string, issueKey: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => attachmentsApi.upload(projectId, issueKey, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments', projectId, issueKey] });
    },
  });
}

export function useDeleteAttachment(projectId: string, issueKey: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (attachmentId: string) => attachmentsApi.delete(projectId, issueKey, attachmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments', projectId, issueKey] });
    },
  });
}
