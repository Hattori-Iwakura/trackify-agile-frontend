'use client';

import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Paperclip, Trash2, Upload } from 'lucide-react';
import { useAttachments, useUploadAttachment, useDeleteAttachment } from '../hooks/use-attachments';

interface AttachmentListProps {
  projectId: string;
  issueKey: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AttachmentList({ projectId, issueKey }: AttachmentListProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: attachments, isLoading } = useAttachments(projectId, issueKey);
  const { mutate: upload, isPending: isUploading } = useUploadAttachment(projectId, issueKey);
  const { mutate: deleteAttachment } = useDeleteAttachment(projectId, issueKey);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      upload(file);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium flex items-center gap-1.5">
          <Paperclip className="h-4 w-4" />
          Attachments
          {attachments && attachments.length > 0 && (
            <span className="text-xs text-muted-foreground">({attachments.length})</span>
          )}
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="h-7 text-xs"
        >
          <Upload className="h-3 w-3 mr-1" />
          {isUploading ? 'Uploading...' : 'Upload'}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ) : attachments && attachments.length > 0 ? (
        <div className="space-y-1.5">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center justify-between rounded-lg border px-3 py-2 bg-muted/30 hover:bg-muted/50 group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Paperclip className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <a
                  href={attachment.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm truncate hover:underline text-primary"
                >
                  {attachment.filename}
                </a>
                <span className="text-xs text-muted-foreground shrink-0">
                  {formatBytes(attachment.size)}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                onClick={() => deleteAttachment(attachment.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">No attachments yet.</p>
      )}
    </div>
  );
}
