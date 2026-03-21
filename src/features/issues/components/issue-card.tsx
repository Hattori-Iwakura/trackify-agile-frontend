'use client';

import Link from 'next/link';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Issue, Priority, IssueType } from '@/shared/types';
import { cn } from '@/lib/utils';

const priorityColors: Record<Priority, string> = {
  LOWEST: 'bg-slate-100 text-slate-600',
  LOW: 'bg-blue-100 text-blue-600',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  HIGH: 'bg-orange-100 text-orange-700',
  HIGHEST: 'bg-red-100 text-red-700',
};

const typeColors: Record<IssueType, string> = {
  EPIC: 'bg-purple-100 text-purple-700',
  STORY: 'bg-green-100 text-green-700',
  TASK: 'bg-blue-100 text-blue-700',
  BUG: 'bg-red-100 text-red-700',
  SUBTASK: 'bg-gray-100 text-gray-700',
};

interface IssueCardProps {
  issue: Issue;
  projectId: string;
  isDragOverlay?: boolean;
}

export function IssueCard({ issue, projectId, isDragOverlay = false }: IssueCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: issue.issueKey, data: { issue } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'rounded-lg border bg-card p-3 shadow-sm cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-40',
        isDragOverlay && 'shadow-lg rotate-1 cursor-grabbing',
      )}
    >
      <Link
        href={`/projects/${projectId}/issues/${issue.issueKey}`}
        onClick={(e) => e.stopPropagation()}
        className="block space-y-2"
      >
        <p className="text-sm font-medium leading-snug line-clamp-2">{issue.title}</p>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-muted-foreground font-mono">{issue.issueKey}</span>
          <Badge
            className={cn('text-xs', priorityColors[issue.priority])}
            variant="outline"
          >
            {issue.priority}
          </Badge>
          <Badge
            className={cn('text-xs', typeColors[issue.type])}
            variant="outline"
          >
            {issue.type}
          </Badge>
        </div>
        {issue.assignee && (
          <div className="flex items-center gap-1.5 pt-1">
            <Avatar size="sm">
              {issue.assignee.avatarUrl && (
                <AvatarImage src={issue.assignee.avatarUrl} alt={issue.assignee.fullName} />
              )}
              <AvatarFallback>
                {issue.assignee.fullName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground truncate">{issue.assignee.fullName}</span>
          </div>
        )}
      </Link>
    </div>
  );
}
