'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useLabels, useCreateLabel, useDeleteLabel } from '../hooks/use-labels';

const labelSchema = z.object({
  name: z.string().min(1, 'Required'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be hex color (e.g. #FF0000)'),
});

type LabelFormValues = z.infer<typeof labelSchema>;

export function LabelsManager() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data } = useLabels(projectId);
  const { mutate: createLabel, isPending } = useCreateLabel(projectId);
  const { mutate: deleteLabel } = useDeleteLabel(projectId);
  const [showForm, setShowForm] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<LabelFormValues>({
    resolver: zodResolver(labelSchema),
    defaultValues: { name: '', color: '#3b82f6' },
  });

  const labels = data?.data || [];

  const onSubmit = (formData: LabelFormValues) => {
    createLabel(formData, { onSuccess: () => { reset(); setShowForm(false); } });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Labels</h3>
        <Button variant="outline" size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />Add Label
        </Button>
      </div>
      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="flex items-end gap-2">
          <div className="space-y-1">
            <Input placeholder="Label name" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1">
            <Input placeholder="#FF0000" {...register('color')} />
            {errors.color && <p className="text-xs text-destructive">{errors.color.message}</p>}
          </div>
          <Button type="submit" size="sm" disabled={isPending}>Create</Button>
        </form>
      )}
      <div className="flex flex-wrap gap-2">
        {labels.map((label) => (
          <Badge key={label.id} variant="outline" style={{ borderColor: label.color, color: label.color }} className="gap-1">
            {label.name}
            <button onClick={() => deleteLabel(label.id)} className="ml-1 hover:text-destructive">
              <Trash2 className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
}
