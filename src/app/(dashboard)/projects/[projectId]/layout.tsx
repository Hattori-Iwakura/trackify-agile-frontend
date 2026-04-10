'use client';

import { useParams } from 'next/navigation';
import { ProjectNav } from '@/shared/components/project-nav';
import { useProject } from '@/features/projects/hooks/use-project';

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: project } = useProject(projectId);

  return (
    <div className="-m-6 flex flex-col">
      <div className="flex items-center justify-between px-6 py-3">
        <h1 className="text-lg font-semibold">{project?.name || 'Loading...'}</h1>
      </div>
      <ProjectNav projectId={projectId} />
      <div className="flex-1 overflow-auto p-6">{children}</div>
    </div>
  );
}
