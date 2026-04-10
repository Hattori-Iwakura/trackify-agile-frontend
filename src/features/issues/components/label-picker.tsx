'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Tag, X, Plus } from 'lucide-react';
import type { Label } from '@/shared/types';
import { useLabels } from '@/features/projects/hooks/use-labels';
import { useAddLabelToIssue, useRemoveLabelFromIssue } from '../hooks/use-issue-mutations';

interface LabelPickerProps {
  projectId: string;
  issueKey: string;
  currentLabels: Label[];
}

export function LabelPicker({ projectId, issueKey, currentLabels }: LabelPickerProps) {
  const { data: allLabels } = useLabels(projectId);
  const { mutate: addLabel } = useAddLabelToIssue(projectId, issueKey);
  const { mutate: removeLabel } = useRemoveLabelFromIssue(projectId, issueKey);

  const currentLabelIds = new Set(currentLabels.map((l: Label) => l.id));
  const availableLabels = allLabels?.data?.filter((l: Label) => !currentLabelIds.has(l.id)) ?? [];

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1 flex-wrap">
        {currentLabels.map((label) => (
          <Badge
            key={label.id}
            variant="outline"
            className="gap-1 pr-1 cursor-default"
            style={{ borderColor: label.color, color: label.color }}
          >
            <Tag className="h-2.5 w-2.5" />
            {label.name}
            <button
              type="button"
              onClick={() => removeLabel(label.id)}
              className="hover:opacity-70 transition-opacity"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </Badge>
        ))}

        {availableLabels.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="h-5 w-5 p-0 rounded-full"
                />
              }
            >
              <Plus className="h-3 w-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {availableLabels.map((label) => (
                <DropdownMenuItem
                  key={label.id}
                  onClick={() => addLabel(label.id)}
                  className="gap-2"
                >
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: label.color }}
                  />
                  {label.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {currentLabels.length === 0 && availableLabels.length === 0 && (
          <span className="text-xs text-muted-foreground">No labels</span>
        )}
      </div>
    </div>
  );
}
