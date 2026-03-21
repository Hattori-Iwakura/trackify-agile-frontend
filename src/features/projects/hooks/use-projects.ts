import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi, type CreateProjectRequest } from '../api/projects.api';

export function useProjects(page = 1, limit = 10) {
  return useQuery({
    queryKey: ['projects', page, limit],
    queryFn: () => projectsApi.findAll(page, limit),
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProjectRequest) => projectsApi.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['projects'] }); },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (projectId: string) => projectsApi.delete(projectId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['projects'] }); },
  });
}
