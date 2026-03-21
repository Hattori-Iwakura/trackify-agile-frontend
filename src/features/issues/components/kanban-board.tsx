'use client';

import { useParams } from 'next/navigation';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  useSensors,
  useSensor,
  PointerSensor,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { IssueStatus, type Issue } from '@/shared/types';
import { useBoard } from '../hooks/use-board';
import { useUpdateIssueStatus } from '../hooks/use-issue-mutations';
import { useBoardStore } from '../stores/board.store';
import { KanbanColumn } from './kanban-column';
import { IssueCard } from './issue-card';
import { BoardFilters } from './board-filters';
import { CreateIssueDialog } from './create-issue-dialog';
import { Skeleton } from '@/components/ui/skeleton';

const COLUMNS: IssueStatus[] = [
  IssueStatus.BACKLOG,
  IssueStatus.TODO,
  IssueStatus.IN_PROGRESS,
  IssueStatus.IN_REVIEW,
  IssueStatus.DONE,
  IssueStatus.CANCELLED,
];

export function KanbanBoard() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: boardData, isLoading } = useBoard(projectId);
  const { mutate: updateStatus } = useUpdateIssueStatus(projectId);
  const { searchText, filterPriority, filterType, dragActiveId, setDragActiveId } = useBoardStore();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  const filterIssues = (issues: Issue[]): Issue[] => {
    return issues.filter((issue) => {
      if (searchText && !issue.title.toLowerCase().includes(searchText.toLowerCase())) return false;
      if (filterPriority && issue.priority !== filterPriority) return false;
      if (filterType && issue.type !== filterType) return false;
      return true;
    });
  };

  const findActiveIssue = (): Issue | undefined => {
    if (!dragActiveId || !boardData) return undefined;
    for (const col of Object.values(boardData)) {
      const found = col.find((i) => i.issueKey === dragActiveId);
      if (found) return found;
    }
    return undefined;
  };

  const handleDragStart = (event: DragStartEvent) => {
    setDragActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setDragActiveId(null);

    if (!over) return;

    const activeIssueKey = String(active.id);

    // The over.id could be a column status or another issue's key
    // Check if over.id is a valid column status
    const overId = String(over.id);
    const isColumn = COLUMNS.includes(overId as IssueStatus);

    let targetStatus: IssueStatus | undefined;

    if (isColumn) {
      targetStatus = overId as IssueStatus;
    } else {
      // over is an issue card — find which column it's in
      if (boardData) {
        for (const [status, issues] of Object.entries(boardData)) {
          if (issues.some((i) => i.issueKey === overId)) {
            targetStatus = status as IssueStatus;
            break;
          }
        }
      }
    }

    if (!targetStatus) return;

    // Find the current status of the active issue
    let currentStatus: IssueStatus | undefined;
    if (boardData) {
      for (const [status, issues] of Object.entries(boardData)) {
        if (issues.some((i) => i.issueKey === activeIssueKey)) {
          currentStatus = status as IssueStatus;
          break;
        }
      }
    }

    if (currentStatus !== targetStatus) {
      updateStatus({ issueKey: activeIssueKey, status: targetStatus });
    }
  };

  const activeIssue = findActiveIssue();

  if (isLoading) {
    return (
      <div className="flex gap-4">
        {COLUMNS.map((col) => (
          <div key={col} className="w-72 shrink-0 space-y-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <BoardFilters />
        <CreateIssueDialog projectId={projectId} />
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((status) => {
            const issues = filterIssues(boardData?.[status] ?? []);
            return (
              <KanbanColumn
                key={status}
                status={status}
                issues={issues}
                projectId={projectId}
              />
            );
          })}
        </div>

        <DragOverlay>
          {activeIssue ? (
            <IssueCard issue={activeIssue} projectId={projectId} isDragOverlay />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
