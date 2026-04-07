'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft } from 'lucide-react';
import { useIssue } from '../hooks/use-issue';
import { useUpdateIssue } from '../hooks/use-issue-mutations';
import { IssueFields } from './issue-fields';
import { AttachmentList } from './attachment-list';
import { CommentThread } from '@/features/comments/components/comment-thread';
import { IssueHistory } from './issue-history';
import { IssueLinks } from './issue-links';

export function IssueDetail() {
  const { projectId, issueKey } = useParams<{ projectId: string; issueKey: string }>();
  const { data: issue, isLoading } = useIssue(projectId, issueKey);
  const { mutate: updateIssue } = useUpdateIssue(projectId, issueKey);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isTitleEditing, setIsTitleEditing] = useState(false);
  const [isDescEditing, setIsDescEditing] = useState(false);

  useEffect(() => {
    if (issue) {
      setTitle(issue.title);
      setDescription(issue.description ?? '');
    }
  }, [issue]);

  const handleTitleBlur = () => {
    setIsTitleEditing(false);
    if (issue && title !== issue.title && title.trim()) {
      updateIssue({ title: title.trim() });
    }
  };

  const handleDescBlur = () => {
    setIsDescEditing(false);
    if (issue && description !== (issue.description ?? '')) {
      updateIssue({ description });
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-32 w-full" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <p className="text-muted-foreground">Issue not found.</p>
        <Button variant="outline" nativeButton={false} render={<Link href={`/projects/${projectId}/board`} />}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to board
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href={`/projects/${projectId}/board`} className="hover:text-foreground flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" />
          Board
        </Link>
        <span>/</span>
        <span className="font-mono">{issue.issueKey}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        {/* Left — main content */}
        <div className="space-y-6">
          {/* Title */}
          {isTitleEditing ? (
            <input
              autoFocus
              className="w-full text-2xl font-bold bg-transparent border-b border-border outline-none pb-1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={(e) => e.key === 'Enter' && handleTitleBlur()}
            />
          ) : (
            <h1
              className="text-2xl font-bold cursor-text hover:bg-muted/50 rounded px-1 -mx-1 transition-colors"
              onClick={() => setIsTitleEditing(true)}
            >
              {title}
            </h1>
          )}

          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
            {isDescEditing ? (
              <Textarea
                autoFocus
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleDescBlur}
                rows={6}
                placeholder="Add a description..."
                className="resize-none"
              />
            ) : (
              <div
                className="min-h-16 cursor-text rounded-lg border border-transparent hover:border-border hover:bg-muted/30 p-2 -m-2 transition-colors text-sm"
                onClick={() => setIsDescEditing(true)}
              >
                {description ? (
                  <p className="whitespace-pre-wrap">{description}</p>
                ) : (
                  <p className="text-muted-foreground">Click to add description...</p>
                )}
              </div>
            )}
          </div>

          {/* Attachments */}
          <div className="rounded-lg border p-4">
            <AttachmentList projectId={projectId} issueKey={issueKey} />
          </div>

          {/* Linked Issues */}
          <div className="rounded-lg border p-4">
            <IssueLinks projectId={projectId} issueKey={issueKey} />
          </div>

          {/* Comments */}
          <div className="rounded-lg border p-4">
            <CommentThread projectId={projectId} issueKey={issueKey} />
          </div>

          {/* Activity / History */}
          <div className="rounded-lg border p-4">
            <IssueHistory projectId={projectId} issueKey={issueKey} />
          </div>
        </div>

        {/* Right — fields sidebar */}
        <div className="rounded-lg border p-4">
          <IssueFields projectId={projectId} issue={issue} />
        </div>
      </div>
    </div>
  );
}
