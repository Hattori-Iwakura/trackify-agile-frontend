'use client';

import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Sprint } from '@/shared/types';
import { SprintHeader } from './sprint-header';
import { IssueCard } from '@/features/issues/components/issue-card';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface SprintPanelProps {
  sprint: Sprint;
  projectId: string;
  onStart?: () => void;
  onComplete?: () => void;
  onDelete?: () => void;
  onUpdate?: (data: { name: string }) => void;
  myProjectRole?: string;
  isStarting?: boolean;
  isCompleting?: boolean;
  isDeleting?: boolean;
}

export function SprintPanel({
  sprint,
  projectId,
  onStart,
  onComplete,
  onDelete,
  onUpdate,
  myProjectRole,
  isStarting,
  isCompleting,
  isDeleting,
}: SprintPanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const issues = sprint.issues ?? [];
  const issueIds = issues.map((i) => i.issueKey);

  const { setNodeRef, isOver } = useDroppable({ id: `sprint-${sprint.id}` });

  return (
    <div className="rounded-lg border bg-card">
      <div
        className="flex items-center gap-2 p-3 cursor-pointer"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
        <div className="flex-1" onClick={(e) => e.stopPropagation()}>
          <SprintHeader
            sprint={sprint}
            issueCount={issues.length}
            onStart={onStart}
            onComplete={onComplete}
            onDelete={onDelete}
            onUpdate={onUpdate}
            myProjectRole={myProjectRole}
            isStarting={isStarting}
            isCompleting={isCompleting}
            isDeleting={isDeleting}
          />
        </div>
      </div>

      {!collapsed && (
        <div
          ref={setNodeRef}
          className={cn(
            'px-3 pb-3 min-h-16 transition-colors rounded-b-lg',
            isOver && 'bg-accent/50',
          )}
        >
          {sprint.goal && (
            <p className="text-xs text-muted-foreground mb-2 italic">{sprint.goal}</p>
          )}
          <SortableContext items={issueIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {issues.map((issue) => (
                <IssueCard key={issue.issueKey} issue={issue} projectId={projectId} />
              ))}
            </div>
          </SortableContext>
          {issues.length === 0 && (
            <div className="flex items-center justify-center h-12 text-xs text-muted-foreground border border-dashed rounded-md">
              Drag issues here to plan this sprint
            </div>
          )}
        </div>
      )}
    </div>
  );
}
