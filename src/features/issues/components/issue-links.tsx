'use client';

import { useState } from 'react';
import { Link2, Trash2, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useIssueLinks, useCreateIssueLink, useRemoveIssueLink } from '../hooks/use-issue-links';
import { IssueLinkType, type IssueLink } from '@/shared/types';
import { toast } from 'sonner';

const LINK_TYPE_LABELS: Record<IssueLinkType, string> = {
  [IssueLinkType.BLOCKS]: 'blocks',
  [IssueLinkType.IS_BLOCKED_BY]: 'is blocked by',
  [IssueLinkType.RELATES_TO]: 'relates to',
  [IssueLinkType.DUPLICATES]: 'duplicates',
  [IssueLinkType.IS_DUPLICATED_BY]: 'is duplicated by',
};

interface IssueLinkRowProps {
  link: IssueLink;
  onRemove: (linkId: string) => void;
  isRemoving: boolean;
  direction: 'from' | 'to';
}

function IssueLinkRow({ link, onRemove, isRemoving, direction }: IssueLinkRowProps) {
  const linkedIssue = direction === 'from' ? link.targetIssue : link.sourceIssue;
  if (!linkedIssue) return null;

  return (
    <div className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-xs text-muted-foreground shrink-0">
          {LINK_TYPE_LABELS[link.linkType]}
        </span>
        <span className="font-mono text-xs text-muted-foreground shrink-0">{linkedIssue.issueKey}</span>
        <span className="truncate">{linkedIssue.title}</span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
        onClick={() => onRemove(link.id)}
        disabled={isRemoving}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

interface IssueLinksProps {
  projectId: string;
  issueKey: string;
}

export function IssueLinks({ projectId, issueKey }: IssueLinksProps) {
  const [adding, setAdding] = useState(false);
  const [targetKey, setTargetKey] = useState('');
  const [linkType, setLinkType] = useState<IssueLinkType>(IssueLinkType.RELATES_TO);

  const { data: links, isLoading } = useIssueLinks(projectId, issueKey);
  const { mutate: createLink, isPending: isCreating } = useCreateIssueLink(projectId, issueKey);
  const { mutate: removeLink, isPending: isRemoving } = useRemoveIssueLink(projectId, issueKey);

  const allLinks = [
    ...(links?.linksFrom ?? []).map((l) => ({ ...l, direction: 'from' as const })),
    ...(links?.linksTo ?? []).map((l) => ({ ...l, direction: 'to' as const })),
  ];

  const handleCreate = () => {
    const key = targetKey.trim().toUpperCase();
    if (!key) return;
    createLink(
      { targetIssueKey: key, linkType },
      {
        onSuccess: () => {
          setTargetKey('');
          setAdding(false);
          toast.success('Link added');
        },
        onError: (err: unknown) => {
          toast.error((err as { message?: string })?.message ?? 'Failed to add link');
        },
      },
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Linked Issues</h3>
          {allLinks.length > 0 && (
            <span className="text-xs text-muted-foreground">({allLinks.length})</span>
          )}
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setAdding((v) => !v)}>
          {adding ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
        </Button>
      </div>

      {adding && (
        <div className="flex flex-col gap-2 rounded-md border p-3">
          <Select value={linkType} onValueChange={(v) => setLinkType(v as IssueLinkType)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(LINK_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value} className="text-xs">
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Input
              className="h-8 text-xs font-mono"
              placeholder="Issue key, e.g. TRK-42"
              value={targetKey}
              onChange={(e) => setTargetKey(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <Button size="sm" className="h-8 text-xs" onClick={handleCreate} disabled={isCreating || !targetKey.trim()}>
              Add
            </Button>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="space-y-2">
          {[1, 2].map((i) => <Skeleton key={i} className="h-9 w-full" />)}
        </div>
      )}

      {!isLoading && allLinks.length === 0 && !adding && (
        <p className="text-xs text-muted-foreground">No linked issues.</p>
      )}

      {!isLoading && allLinks.length > 0 && (
        <div className="space-y-1.5">
          {allLinks.map((link) => (
            <IssueLinkRow
              key={link.id}
              link={link}

              direction={link.direction}
              onRemove={removeLink}
              isRemoving={isRemoving}
            />
          ))}
        </div>
      )}
    </div>
  );
}
