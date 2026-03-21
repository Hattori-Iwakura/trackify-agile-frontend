'use client';

import { useState, useRef, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Sprint } from '@/shared/types';
import { SprintStatus } from '@/shared/types';
import { Play, CheckCircle, Trash2, Calendar } from 'lucide-react';

const statusColors: Record<SprintStatus, string> = {
  PLANNING: 'bg-blue-100 text-blue-700',
  ACTIVE: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-slate-100 text-slate-600',
};

interface SprintHeaderProps {
  sprint: Sprint;
  issueCount: number;
  onStart?: () => void;
  onComplete?: () => void;
  onDelete?: () => void;
  onUpdate?: (data: { name: string }) => void;
  isStarting?: boolean;
  isCompleting?: boolean;
  isDeleting?: boolean;
}

export function SprintHeader({
  sprint,
  issueCount,
  onStart,
  onComplete,
  onDelete,
  onUpdate,
  isStarting,
  isCompleting,
  isDeleting,
}: SprintHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(sprint.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditName(sprint.name);
  }, [sprint.name]);

  const handleSave = () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== sprint.name) {
      onUpdate?.({ name: trimmed });
    } else {
      setEditName(sprint.name);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditName(sprint.name);
      setIsEditing(false);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const startDate = formatDate(sprint.startDate);
  const endDate = formatDate(sprint.endDate);

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {isEditing ? (
          <Input
            ref={inputRef}
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="h-7 w-48 text-sm font-semibold"
          />
        ) : (
          <h3
            className="font-semibold text-sm cursor-pointer hover:text-primary/80"
            onClick={() => onUpdate && setIsEditing(true)}
            title={onUpdate ? 'Click to edit sprint name' : undefined}
          >
            {sprint.name}
          </h3>
        )}
        <Badge className={statusColors[sprint.status]} variant="outline">
          {sprint.status}
        </Badge>
        <span className="text-xs text-muted-foreground">{issueCount} issues</span>
        {(startDate || endDate) && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {startDate && endDate ? `${startDate} - ${endDate}` : startDate || endDate}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1">
        {sprint.status === SprintStatus.PLANNING && (
          <>
            <Button size="sm" variant="outline" onClick={onStart} disabled={isStarting}>
              <Play className="mr-1 h-3 w-3" />
              {isStarting ? 'Starting...' : 'Start Sprint'}
            </Button>
            <Button size="sm" variant="outline" onClick={onDelete} disabled={isDeleting}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </>
        )}
        {sprint.status === SprintStatus.ACTIVE && (
          <Button size="sm" variant="outline" onClick={onComplete} disabled={isCompleting}>
            <CheckCircle className="mr-1 h-3 w-3" />
            {isCompleting ? 'Completing...' : 'Complete Sprint'}
          </Button>
        )}
      </div>
    </div>
  );
}
