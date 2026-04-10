"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorMessage } from "@/lib/api";
import { createProject } from "@/lib/projects-issues-api";
import { isNestBackendConfigured } from "@/lib/aggregate-my-dashboard";

export interface CreateProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

export function CreateProjectModal({ open, onOpenChange, onCreated }: CreateProjectModalProps) {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [key, setKey] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const resetForm = React.useCallback(() => {
    setName("");
    setKey("");
    setDescription("");
    setError(null);
    setSubmitting(false);
  }, []);

  React.useEffect(() => {
    if (!open) resetForm();
  }, [open, resetForm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isNestBackendConfigured()) {
      setError("Cần NEXT_PUBLIC_API_URL trỏ Nest (vd: http://localhost:4000/api).");
      return;
    }
    const normalizedKey = key.trim().toUpperCase();
    if (normalizedKey.length < 2 || normalizedKey.length > 10) {
      setError("Key: 2–10 ký tự, bắt đầu bằng chữ cái, chỉ chữ in hoa và số.");
      return;
    }
    if (!/^[A-Z][A-Z0-9]*$/.test(normalizedKey)) {
      setError("Key phải bắt đầu bằng chữ cái và chỉ gồm chữ in hoa, số.");
      return;
    }
    setSubmitting(true);
    try {
      const project = await createProject({
        name: name.trim(),
        key: normalizedKey,
        description: description.trim() || undefined,
      });
      onOpenChange(false);
      onCreated?.();
      router.push(`/dashboard/projects/${project.id}/board`);
    } catch (err) {
      setError(getApiErrorMessage(err, "Không tạo được project."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" showCloseButton>
        <DialogHeader>
          <DialogTitle>Tạo project mới</DialogTitle>
          <DialogDescription>
            Điền tên, key và mô tả (tùy chọn). Key dùng cho mã issue (vd. TRK-1).
          </DialogDescription>
        </DialogHeader>

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="modal-project-name">
              Tên project <span className="text-destructive">*</span>
            </Label>
            <Input
              id="modal-project-name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Trackify Agile"
              required
              maxLength={100}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="modal-project-key">
              Key (mã viết tắt) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="modal-project-key"
              name="key"
              value={key}
              onChange={(e) => setKey(e.target.value.toUpperCase())}
              placeholder="VD: TRK"
              required
              maxLength={10}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Dùng cho issue key (TRK-1, TRK-2). 2–10 ký tự, bắt đầu bằng chữ cái.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="modal-project-description">Mô tả</Label>
            <Textarea
              id="modal-project-description"
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tùy chọn, tối đa 500 ký tự"
              rows={3}
              maxLength={500}
            />
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Đang tạo…" : "Tạo project"}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Hủy
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
