'use client';

import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Issue } from '@/shared/types';
import { IssueCard } from '@/features/issues/components/issue-card';
import { CreateIssueDialog } from '@/features/issues/components/create-issue-dialog';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface BacklogPanelProps {
  issues: Issue[];
  projectId: string;
  isLoading?: boolean;
}

export function BacklogPanel({ issues, projectId, isLoading }: BacklogPanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const issueIds = issues.map((i) => i.issueKey);

  const { setNodeRef, isOver } = useDroppable({ id: 'backlog' });

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center justify-between p-3">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
          <h3 className="font-semibold text-sm">Backlog</h3>
          <span className="text-xs text-muted-foreground">{issues.length} issues</span>
        </div>
        <CreateIssueDialog projectId={projectId} />
      </div>

      {!collapsed && (
        <div
          ref={setNodeRef}
          className={cn(
            'px-3 pb-3 min-h-16 transition-colors rounded-b-lg',
            isOver && 'bg-accent/50',
          )}
        >
          {isLoading ? (
            <div className="text-xs text-muted-foreground text-center py-4">Loading...</div>
          ) : (
            <SortableContext items={issueIds} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {issues.map((issue) => (
                  <IssueCard key={issue.issueKey} issue={issue} projectId={projectId} />
                ))}
              </div>
            </SortableContext>
          )}
          {!isLoading && issues.length === 0 && (
            <div className="flex items-center justify-center h-12 text-xs text-muted-foreground border border-dashed rounded-md">
              No issues in backlog
            </div>
          )}
        </div>
      )}
    </div>
  );
}
