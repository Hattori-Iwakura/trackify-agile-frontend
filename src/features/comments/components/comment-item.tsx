'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Reply } from 'lucide-react';
import { formatRelativeTime } from '@/shared/utils/format-date';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { useUpdateComment, useDeleteComment, useCreateComment } from '../hooks/use-comment-mutations';
import { CommentForm } from './comment-form';
import type { Comment } from '@/shared/types';

interface CommentItemProps {
  comment: Comment;
  projectId: string;
  issueKey: string;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function CommentItem({ comment, projectId, issueKey }: CommentItemProps) {
  const user = useAuthStore((s) => s.user);
  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);

  const { mutate: updateComment, isPending: isUpdating } = useUpdateComment(projectId, issueKey);
  const { mutate: deleteComment } = useDeleteComment(projectId, issueKey);
  const { mutate: createComment, isPending: isCreating } = useCreateComment(projectId, issueKey);

  const isAuthor = user?.id === comment.authorId;
  const authorName = comment.author?.fullName ?? 'Unknown';

  const handleEdit = (content: string) => {
    updateComment(
      { commentId: comment.id, data: { content } },
      { onSuccess: () => setIsEditing(false) },
    );
  };

  const handleDelete = () => {
    deleteComment(comment.id);
  };

  const handleReply = (content: string) => {
    createComment(
      { content, parentId: comment.id },
      { onSuccess: () => setIsReplying(false) },
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <Avatar size="sm">
          {comment.author?.avatarUrl && <AvatarImage src={comment.author.avatarUrl} />}
          <AvatarFallback>{getInitials(authorName)}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{authorName}</span>
            <span className="text-xs text-muted-foreground">{formatRelativeTime(comment.createdAt)}</span>
          </div>

          {isEditing ? (
            <div className="mt-2">
              <CommentForm
                initialContent={comment.content}
                onSubmit={handleEdit}
                submitLabel="Save"
                isLoading={isUpdating}
                onCancel={() => setIsEditing(false)}
              />
            </div>
          ) : (
            <p className="text-sm mt-1 whitespace-pre-wrap">{comment.content}</p>
          )}

          {!isEditing && (
            <div className="flex items-center gap-1 mt-1">
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setIsReplying(!isReplying)}>
                <Reply className="h-3 w-3 mr-1" />
                Reply
              </Button>
              {isAuthor && (
                <>
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setIsEditing(true)}>
                    <Pencil className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-destructive" onClick={handleDelete}>
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Reply form */}
      {isReplying && (
        <div className="ml-9">
          <CommentForm
            onSubmit={handleReply}
            placeholder="Write a reply..."
            submitLabel="Reply"
            isLoading={isCreating}
            onCancel={() => setIsReplying(false)}
          />
        </div>
      )}

      {/* Nested replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-9 space-y-3 border-l-2 border-border pl-4">
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} projectId={projectId} issueKey={issueKey} />
          ))}
        </div>
      )}
    </div>
  );
}
