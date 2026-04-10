'use client';

import { useProjects } from '../hooks/use-projects';
import { ProjectCard } from './project-card';
import { CreateProjectDialog } from './create-project-dialog';
import { Skeleton } from '@/components/ui/skeleton';

export function ProjectList() {
  const { data, isLoading } = useProjects();
  const projects = data?.data || [];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Projects</h1>
        <CreateProjectDialog />
      </div>
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <p className="text-muted-foreground">No projects yet. Create your first project!</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
