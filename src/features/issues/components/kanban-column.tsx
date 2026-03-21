'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Issue, IssueStatus } from '@/shared/types';
import { IssueCard } from './issue-card';
import { cn } from '@/lib/utils';

const statusLabels: Record<IssueStatus, string> = {
  BACKLOG: 'Backlog',
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review',
  DONE: 'Done',
  CANCELLED: 'Cancelled',
};

const statusColors: Record<IssueStatus, string> = {
  BACKLOG: 'bg-slate-100 text-slate-600',
  TODO: 'bg-blue-100 text-blue-600',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
  IN_REVIEW: 'bg-purple-100 text-purple-700',
  DONE: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

interface KanbanColumnProps {
  status: IssueStatus;
  issues: Issue[];
  projectId: string;
}

export function KanbanColumn({ status, issues, projectId }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const issueIds = issues.map((i) => i.issueKey);

  return (
    <div className="flex flex-col w-72 shrink-0">
      {/* Column header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', statusColors[status])}>
          {statusLabels[status]}
        </span>
        <span className="text-xs text-muted-foreground font-mono">{issues.length}</span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex flex-col gap-2 rounded-xl min-h-32 p-2 transition-colors',
          isOver ? 'bg-accent/50' : 'bg-muted/30',
        )}
      >
        <SortableContext items={issueIds} strategy={verticalListSortingStrategy}>
          {issues.map((issue) => (
            <IssueCard key={issue.issueKey} issue={issue} projectId={projectId} />
          ))}
        </SortableContext>

        {issues.length === 0 && (
          <div className="flex items-center justify-center h-16 text-xs text-muted-foreground">
            Drop issues here
          </div>
        )}
      </div>
    </div>
  );
}
