'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { Priority, IssueType } from '@/shared/types';
import { useCreateIssue } from '../hooks/use-issue-mutations';

const createIssueSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  priority: z.nativeEnum(Priority).optional(),
  type: z.nativeEnum(IssueType).optional(),
});

type CreateIssueFormValues = z.infer<typeof createIssueSchema>;

interface CreateIssueDialogProps {
  projectId: string;
}

export function CreateIssueDialog({ projectId }: CreateIssueDialogProps) {
  const [open, setOpen] = useState(false);
  const { mutate: createIssue, isPending } = useCreateIssue(projectId);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateIssueFormValues>({
    resolver: zodResolver(createIssueSchema),
    defaultValues: {
      priority: Priority.MEDIUM,
      type: IssueType.TASK,
    },
  });

  const priority = watch('priority');
  const type = watch('type');

  const onSubmit = (data: CreateIssueFormValues) => {
    createIssue(
      {
        title: data.title,
        description: data.description,
        priority: data.priority,
        type: data.type,
      },
      {
        onSuccess: () => {
          reset();
          setOpen(false);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus className="mr-1.5 h-4 w-4" />
        Create Issue
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Issue</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...register('title')} placeholder="Issue title" />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...register('description')} placeholder="Optional description" rows={3} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={priority}
                onValueChange={(val) => setValue('priority', val as Priority)}
              >
                <SelectTrigger size="sm" className="w-full">
                  <SelectValue placeholder="Priority" />
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

            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={type}
                onValueChange={(val) => setValue('type', val as IssueType)}
              >
                <SelectTrigger size="sm" className="w-full">
                  <SelectValue placeholder="Type" />
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
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Creating...' : 'Create Issue'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
