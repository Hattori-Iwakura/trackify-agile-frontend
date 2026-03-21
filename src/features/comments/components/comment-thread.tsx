'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare } from 'lucide-react';
import { useComments } from '../hooks/use-comments';
import { useCreateComment } from '../hooks/use-comment-mutations';
import { CommentForm } from './comment-form';
import { CommentItem } from './comment-item';

interface CommentThreadProps {
  projectId: string;
  issueKey: string;
}

export function CommentThread({ projectId, issueKey }: CommentThreadProps) {
  const { data: comments, isLoading } = useComments(projectId, issueKey);
  const { mutate: createComment, isPending } = useCreateComment(projectId, issueKey);

  const topLevelComments = comments?.filter((c) => c.parentId === null) ?? [];

  const handleCreate = (content: string) => {
    createComment({ content });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium flex items-center gap-1.5">
        <MessageSquare className="h-4 w-4" />
        Comments
        {topLevelComments.length > 0 && (
          <span className="text-muted-foreground">({topLevelComments.length})</span>
        )}
      </h3>

      <CommentForm onSubmit={handleCreate} isLoading={isPending} />

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-6 w-6 rounded-full shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : topLevelComments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No comments yet. Be the first to comment.
        </p>
      ) : (
        <div className="space-y-4">
          {topLevelComments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} projectId={projectId} issueKey={issueKey} />
          ))}
        </div>
      )}
    </div>
  );
}
