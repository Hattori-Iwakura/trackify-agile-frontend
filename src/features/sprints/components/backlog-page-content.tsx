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
import { useState } from 'react';
import { SprintStatus, type Issue, type Sprint } from '@/shared/types';
import { useSprints } from '../hooks/use-sprints';
import { useBacklog } from '../hooks/use-backlog';
import {
  useStartSprint,
  useCompleteSprint,
  useDeleteSprint,
  useUpdateSprint,
  useAddIssueToSprint,
  useRemoveIssueFromSprint,
} from '../hooks/use-sprint-mutations';
import { SprintPanel } from './sprint-panel';
import { BacklogPanel } from './backlog-panel';
import { CreateSprintDialog } from './create-sprint-dialog';
import { IssueCard } from '@/features/issues/components/issue-card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

function sortSprints(sprints: Sprint[]): Sprint[] {
  const order: Record<SprintStatus, number> = {
    [SprintStatus.ACTIVE]: 0,
    [SprintStatus.PLANNING]: 1,
    [SprintStatus.COMPLETED]: 2,
  };
  return [...sprints].sort((a, b) => order[a.status] - order[b.status]);
}

export function BacklogPageContent() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: sprints, isLoading: sprintsLoading } = useSprints(projectId);
  const { data: backlogIssues, isLoading: backlogLoading } = useBacklog(projectId);
  const startMutation = useStartSprint(projectId);
  const completeMutation = useCompleteSprint(projectId);
  const deleteMutation = useDeleteSprint(projectId);
  const updateMutation = useUpdateSprint(projectId);
  const { mutate: addIssue } = useAddIssueToSprint(projectId);
  const { mutate: removeIssue } = useRemoveIssueFromSprint(projectId);

  const [dragActiveIssue, setDragActiveIssue] = useState<Issue | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  const findIssueByKey = (issueKey: string): { issue: Issue; source: string } | null => {
    // Check sprints
    if (sprints) {
      for (const sprint of sprints) {
        const issue = sprint.issues?.find((i) => i.issueKey === issueKey);
        if (issue) return { issue, source: `sprint-${sprint.id}` };
      }
    }
    // Check backlog
    if (backlogIssues) {
      const issue = backlogIssues.find((i) => i.issueKey === issueKey);
      if (issue) return { issue, source: 'backlog' };
    }
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const issueKey = String(event.active.id);
    const found = findIssueByKey(issueKey);
    if (found) setDragActiveIssue(found.issue);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setDragActiveIssue(null);

    if (!over) return;

    const issueKey = String(active.id);
    const overId = String(over.id);
    const found = findIssueByKey(issueKey);

    if (!found) return;

    // Determine target container
    let targetId: string;
    if (overId === 'backlog' || overId.startsWith('sprint-')) {
      targetId = overId;
    } else {
      // Dropped on another issue - find which container it belongs to
      const targetIssue = findIssueByKey(overId);
      if (!targetIssue) return;
      targetId = targetIssue.source;
    }

    // No-op if same container
    if (found.source === targetId) return;

    // Moving to backlog = remove from sprint
    if (targetId === 'backlog' && found.source.startsWith('sprint-')) {
      const sprintId = found.source.replace('sprint-', '');
      removeIssue({ sprintId, issueKey });
      return;
    }

    // Moving to a sprint
    if (targetId.startsWith('sprint-')) {
      const targetSprintId = targetId.replace('sprint-', '');

      // If coming from another sprint, remove first then add
      if (found.source.startsWith('sprint-')) {
        const sourceSprintId = found.source.replace('sprint-', '');
        removeIssue(
          { sprintId: sourceSprintId, issueKey },
          {
            onSuccess: () => {
              addIssue({ sprintId: targetSprintId, issueKey });
            },
            onError: () => {
              toast.error('Failed to move issue');
            },
          },
        );
      } else {
        // Coming from backlog
        addIssue({ sprintId: targetSprintId, issueKey });
      }
    }
  };

  // Helper to check if a specific sprint is pending for a given mutation
  const isSprintPending = (
    mutation: { isPending: boolean; variables?: string },
    sprintId: string,
  ) => mutation.isPending && mutation.variables === sprintId;

  if (sprintsLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const sortedSprints = sortSprints(sprints ?? []);

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Backlog</h2>
        <CreateSprintDialog projectId={projectId} />
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-3">
          {sortedSprints.map((sprint) => (
            <SprintPanel
              key={sprint.id}
              sprint={sprint}
              projectId={projectId}
              onStart={() => startMutation.mutate(sprint.id)}
              onComplete={() => completeMutation.mutate(sprint.id)}
              onDelete={() => deleteMutation.mutate(sprint.id)}
              onUpdate={(data) =>
                updateMutation.mutate({ ...data, sprintId: sprint.id })
              }
              isStarting={isSprintPending(startMutation, sprint.id)}
              isCompleting={isSprintPending(completeMutation, sprint.id)}
              isDeleting={isSprintPending(deleteMutation, sprint.id)}
            />
          ))}

          <BacklogPanel
            issues={backlogIssues ?? []}
            projectId={projectId}
            isLoading={backlogLoading}
          />
        </div>

        <DragOverlay>
          {dragActiveIssue ? (
            <IssueCard issue={dragActiveIssue} projectId={projectId} isDragOverlay />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
