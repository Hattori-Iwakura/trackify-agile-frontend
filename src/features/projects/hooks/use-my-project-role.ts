import { useMemo } from 'react';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { getMyProjectRole } from '@/lib/project-role';
import { useMembers } from './use-members';

/** Current user's role in the project (`""` if not a member). `undefined` while members query is loading. */
export function useMyProjectRole(projectId: string) {
  const userId = useAuthStore((s) => s.user?.id);
  const { data: membersPage, isLoading } = useMembers(projectId, 1, 100);

  return useMemo(() => {
    if (!projectId || !userId) return undefined;
    if (isLoading) return undefined;
    const members = membersPage?.data ?? [];
    return getMyProjectRole(members, userId);
  }, [projectId, userId, membersPage, isLoading]);
}
