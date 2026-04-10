import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { membersApi, type AddMemberRequest } from '../api/members.api';
import type { ProjectRole } from '@/shared/types';

export function useMembers(projectId: string, page = 1, limit = 20) {
  return useQuery({
    queryKey: ['members', projectId, page, limit],
    queryFn: () => membersApi.findAll(projectId, page, limit),
    enabled: !!projectId,
  });
}

export function useAddMember(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AddMemberRequest) => membersApi.addMember(projectId, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['members', projectId] }); },
  });
}

export function useUpdateMemberRole(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: ProjectRole }) =>
      membersApi.updateRole(projectId, userId, role),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['members', projectId] }); },
  });
}

export function useLeaveProject(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => membersApi.leave(projectId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['projects'] }); },
  });
}

export function useRemoveMember(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => membersApi.removeMember(projectId, userId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['members', projectId] }); },
  });
}
