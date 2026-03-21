'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { IssueStatus, Priority, IssueType, type Issue } from '@/shared/types';
import { useMembers } from '@/features/projects/hooks/use-members';
import { useUpdateIssue, useUpdateIssueStatus } from '../hooks/use-issue-mutations';
import { LabelPicker } from './label-picker';

interface IssueFieldsProps {
  projectId: string;
  issue: Issue;
}

const statusLabels: Record<IssueStatus, string> = {
  BACKLOG: 'Backlog',
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review',
  DONE: 'Done',
  CANCELLED: 'Cancelled',
};

export function IssueFields({ projectId, issue }: IssueFieldsProps) {
  const { mutate: updateIssue } = useUpdateIssue(projectId, issue.issueKey);
  const { mutate: updateStatus } = useUpdateIssueStatus(projectId);
  const { data: membersData } = useMembers(projectId);
  const members = membersData?.data ?? [];

  return (
    <div className="space-y-4">
      {/* Status */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</p>
        <Select
          value={issue.status}
          onValueChange={(val) => updateStatus({ issueKey: issue.issueKey, status: val as IssueStatus })}
        >
          <SelectTrigger size="sm" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.values(IssueStatus).map((s) => (
              <SelectItem key={s} value={s}>
                {statusLabels[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Priority */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Priority</p>
        <Select
          value={issue.priority}
          onValueChange={(val) => { if (val) updateIssue({ priority: val }); }}
        >
          <SelectTrigger size="sm" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.values(Priority).map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Type */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Type</p>
        <Select
          value={issue.type}
          onValueChange={(val) => { if (val) updateIssue({ type: val }); }}
        >
          <SelectTrigger size="sm" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.values(IssueType).map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Assignee */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Assignee</p>
        <Select
          value={issue.assigneeId ?? 'unassigned'}
          onValueChange={(val) => updateIssue({ assigneeId: val === 'unassigned' ? null : val })}
        >
          <SelectTrigger size="sm" className="w-full">
            <SelectValue placeholder="Unassigned" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            {members.map((member) => (
              <SelectItem key={member.userId} value={member.userId}>
                <span className="flex items-center gap-2">
                  <Avatar size="sm">
                    {member.user?.avatarUrl && (
                      <AvatarImage src={member.user.avatarUrl} alt={member.user.fullName} />
                    )}
                    <AvatarFallback>
                      {member.user?.fullName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {member.user?.fullName}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Labels */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Labels</p>
        <LabelPicker
          projectId={projectId}
          issueKey={issue.issueKey}
          currentLabels={issue.labels ?? []}
        />
      </div>
    </div>
  );
}
