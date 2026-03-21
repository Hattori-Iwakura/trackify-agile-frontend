'use client';

import { useParams } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useMembers, useUpdateMemberRole, useRemoveMember, useLeaveProject } from '../hooks/use-members';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { InviteMemberDialog } from './invite-member-dialog';
import { ProjectRole } from '@/shared/types';

export function MembersTable() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data } = useMembers(projectId);
  const { mutate: updateRole } = useUpdateMemberRole(projectId);
  const { mutate: removeMember } = useRemoveMember(projectId);
  const { mutate: leaveProject } = useLeaveProject(projectId);
  const currentUserId = useAuthStore((s) => s.user?.id);
  const members = data?.data || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Members</h3>
        <InviteMemberDialog />
      </div>
      <div className="space-y-2">
        {members.map((member) => {
          const initials = member.user?.fullName?.split(' ').map((n) => n[0]).join('').toUpperCase() || '?';
          const isCurrentUser = member.userId === currentUserId;
          return (
            <div key={member.id} className="flex items-center justify-between rounded-md border p-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={member.user?.avatarUrl || undefined} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{member.user?.fullName}</p>
                  <p className="text-xs text-muted-foreground">{member.user?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={member.role}
                  onValueChange={(role) => updateRole({ userId: member.userId, role: role as ProjectRole })}
                >
                  <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.values(ProjectRole).map((role) => (
                      <SelectItem key={role} value={role}>{role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isCurrentUser ? (
                  <Button variant="outline" size="sm" onClick={() => leaveProject()}>Leave</Button>
                ) : (
                  <Button variant="ghost" size="icon" onClick={() => removeMember(member.userId)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
