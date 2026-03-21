'use client';

import Link from 'next/link';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUnreadCount } from '../hooks/use-unread-count';

export function NotificationBell() {
  const { data } = useUnreadCount();
  const count = data ?? 0;

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative"
      nativeButton={false}
      render={<Link href="/notifications" />}
    >
      <Bell className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-xs font-medium text-destructive-foreground">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Button>
  );
}
