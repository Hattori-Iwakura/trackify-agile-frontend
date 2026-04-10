'use client';

import {
  UserPlus,
  ArrowRightLeft,
  MessageSquare,
  AtSign,
  Play,
  CheckCircle,
  Users,
  BellRing,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/shared/utils/format-date';
import { NotificationType } from '@/shared/types';
import type { Notification } from '@/shared/types';
import { useMarkAsRead } from '../hooks/use-notification-mutations';

const iconMap: Record<NotificationType, React.ElementType> = {
  [NotificationType.ISSUE_ASSIGNED]: UserPlus,
  [NotificationType.ISSUE_STATUS_CHANGED]: ArrowRightLeft,
  [NotificationType.COMMENT_ADDED]: MessageSquare,
  [NotificationType.MENTIONED]: AtSign,
  [NotificationType.SPRINT_STARTED]: Play,
  [NotificationType.SPRINT_COMPLETED]: CheckCircle,
  [NotificationType.MEMBER_INVITED]: Users,
};

interface NotificationItemProps {
  notification: Notification;
}

export function NotificationItem({ notification }: NotificationItemProps) {
  const { mutate: markAsRead } = useMarkAsRead();
  const Icon = iconMap[notification.type] || BellRing;

  const handleClick = () => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-accent',
        !notification.isRead && 'bg-accent/50',
      )}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <p className={cn('text-sm', !notification.isRead && 'font-semibold')}>
            {notification.title}
          </p>
          {!notification.isRead && (
            <span className="h-2 w-2 shrink-0 rounded-full bg-blue-500" />
          )}
        </div>
        <p className="text-sm text-muted-foreground">{notification.message}</p>
        <p className="text-xs text-muted-foreground">{formatRelativeTime(notification.createdAt)}</p>
      </div>
    </button>
  );
}
