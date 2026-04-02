"use client";

import * as React from "react";
import { Modal, Button, Input, Label } from "@/components/ui";
import { getApiErrorMessage } from "@/lib/api";
import { createIssue } from "@/lib/projects-issues-api";

interface CreateSubTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  parentIssueKey: string;
  parentTaskName?: string;
  onCreated?: () => void;
}

export function CreateSubTaskModal({
  open,
  onOpenChange,
  projectId,
  parentIssueKey,
  parentTaskName,
  onCreated,
}: CreateSubTaskModalProps) {
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function reset() {
    setTitle("");
    setDescription("");
    setError(null);
    setSubmitting(false);
  }

  React.useEffect(() => {
    if (!open) reset();
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await createIssue(projectId, {
        title: title.trim(),
        description: description.trim() || undefined,
        type: "SUBTASK",
        // parentId sent as extra field — backend reads it from body
        ...(parentIssueKey ? { parentIssueKey } : {}),
      } as Parameters<typeof createIssue>[1] & { parentIssueKey?: string });
      onCreated?.();
      onOpenChange(false);
    } catch (err) {
      setError(getApiErrorMessage(err, "Không tạo được subtask."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Thêm task con"
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Hủy
          </Button>
          <Button type="submit" form="create-subtask-form" disabled={submitting || !title.trim()}>
            {submitting ? "Đang tạo…" : "Thêm task con"}
          </Button>
        </>
      }
    >
      <form id="create-subtask-form" onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        {parentTaskName && (
          <p className="text-sm text-muted-foreground">
            Task cha: <span className="font-medium text-foreground">{parentTaskName}</span>
          </p>
        )}
        {error && (
          <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        <div className="space-y-2">
          <Label htmlFor="subtask-title">
            Tiêu đề <span className="text-destructive">*</span>
          </Label>
          <Input
            id="subtask-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nhập tiêu đề"
            required
            autoFocus
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="subtask-description">Mô tả</Label>
          <Input
            id="subtask-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mô tả (tùy chọn)"
          />
        </div>
      </form>
    </Modal>
  );
}
