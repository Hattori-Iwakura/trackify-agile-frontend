import { apiClient } from '@/shared/lib/api-client';
import type { Attachment } from '@/shared/types';

export const attachmentsApi = {
  upload: (projectId: string, issueKey: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient<Attachment>(`/projects/${projectId}/issues/${issueKey}/attachments`, { method: 'POST', body: formData });
  },
  findAll: (projectId: string, issueKey: string) =>
    apiClient<Attachment[]>(`/projects/${projectId}/issues/${issueKey}/attachments`),
  delete: (projectId: string, issueKey: string, attachmentId: string) =>
    apiClient<void>(`/projects/${projectId}/issues/${issueKey}/attachments/${attachmentId}`, { method: 'DELETE' }),
};
