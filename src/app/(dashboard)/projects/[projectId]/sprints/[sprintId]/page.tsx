'use client';

import { useParams, useRouter } from 'next/navigation';
import { useSprint } from '@/features/sprints/hooks/use-sprint';
import {
  useStartSprint,
  useCompleteSprint,
  useUpdateSprint,
  useDeleteSprint,
} from '@/features/sprints/hooks/use-sprint-mutations';
import { useMyProjectRole } from '@/features/projects/hooks/use-my-project-role';
import { SprintHeader } from '@/features/sprints/components/sprint-header';
import { IssueCard } from '@/features/issues/components/issue-card';
import { Skeleton } from '@/components/ui/skeleton';

export default function SprintDetailPage() {
  const router = useRouter();
  const { projectId, sprintId } = useParams<{ projectId: string; sprintId: string }>();
  const myProjectRole = useMyProjectRole(projectId);
  const { data: sprint, isLoading } = useSprint(projectId, sprintId);
  const { mutate: startSprint, isPending: isStarting } = useStartSprint(projectId);
  const { mutate: completeSprint, isPending: isCompleting } = useCompleteSprint(projectId);
  const { mutate: updateSprint } = useUpdateSprint(projectId, sprintId);
  const { mutate: deleteSprint, isPending: isDeleting } = useDeleteSprint(projectId);

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!sprint) {
    return <div className="p-4 text-muted-foreground">Sprint not found.</div>;
  }

  const issues = sprint.issues ?? [];

  return (
    <div className="flex flex-col gap-4 p-4">
      <SprintHeader
        sprint={sprint}
        issueCount={issues.length}
        onStart={() => startSprint(sprint.id)}
        onComplete={() => completeSprint(sprint.id)}
        onDelete={() =>
          deleteSprint(sprint.id, {
            onSuccess: () => router.push(`/projects/${projectId}/backlog`),
          })
        }
        onUpdate={(data) => updateSprint(data)}
        myProjectRole={myProjectRole}
        isStarting={isStarting}
        isCompleting={isCompleting}
        isDeleting={isDeleting}
      />

      {sprint.goal && (
        <p className="text-sm text-muted-foreground italic">{sprint.goal}</p>
      )}

      <div className="space-y-2">
        <h4 className="text-sm font-medium">Issues ({issues.length})</h4>
        {issues.length === 0 ? (
          <p className="text-xs text-muted-foreground">No issues in this sprint.</p>
        ) : (
          <div className="space-y-2">
            {issues.map((issue) => (
              <IssueCard key={issue.issueKey} issue={issue} projectId={projectId} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
