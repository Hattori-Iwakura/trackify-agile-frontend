'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus } from 'lucide-react';
import { useAddMember } from '../hooks/use-members';

const inviteSchema = z.object({
  userId: z.string().uuid('Must be a valid user ID'),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

export function InviteMemberDialog() {
  const { projectId } = useParams<{ projectId: string }>();
  const [open, setOpen] = useState(false);
  const { mutate: addMember, isPending } = useAddMember(projectId);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { userId: '' },
  });

  const onSubmit = (data: InviteFormValues) => {
    addMember(data, { onSuccess: () => { reset(); setOpen(false); } });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <UserPlus className="mr-2 h-4 w-4" />Invite
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Invite Member</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userId">User ID</Label>
            <Input id="userId" placeholder="UUID" {...register('userId')} />
            {errors.userId && <p className="text-sm text-destructive">{errors.userId.message}</p>}
          </div>
          <Button type="submit" disabled={isPending}>{isPending ? 'Inviting...' : 'Invite'}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
