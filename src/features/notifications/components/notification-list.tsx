'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Notification } from '@/shared/types';
import { useNotifications } from '../hooks/use-notifications';
import { useMarkAllAsRead } from '../hooks/use-notification-mutations';
import { NotificationItem } from './notification-item';

type NotificationFilter = 'all' | 'unread' | 'read';

function filterNotifications(list: Notification[], filter: NotificationFilter): Notification[] {
  if (filter === 'unread') return list.filter((n) => !n.isRead);
  if (filter === 'read') return list.filter((n) => n.isRead);
  return list;
}

export function NotificationList() {
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const [page, setPage] = useState(1);
  const [accumulated, setAccumulated] = useState<Notification[]>([]);

  const { data, isLoading, isFetching } = useNotifications(page);
  const { mutate: markAllAsRead, isPending } = useMarkAllAsRead();

  const meta = data?.meta;

  useEffect(() => {
    if (!data?.data || !meta) return;
    setAccumulated((prev) => {
      if (page === 1) return data.data;

      const incomingById = new Map(data.data.map((n) => [n.id, n]));
      const updated = prev.map((n) => incomingById.get(n.id) ?? n);
      const prevIds = new Set(prev.map((n) => n.id));
      const appended = data.data.filter((n) => !prevIds.has(n.id));
      return appended.length ? [...updated, ...appended] : updated;
    });
  }, [data, page, meta]);

  const filteredNotifications = useMemo(
    () => filterNotifications(accumulated, filter),
    [accumulated, filter],
  );

  const showInitialSkeleton = isLoading && page === 1 && accumulated.length === 0;

  if (showInitialSkeleton) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!isLoading && accumulated.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <p className="text-lg">No notifications yet</p>
        <p className="text-sm">You will see notifications here when something happens.</p>
      </div>
    );
  }

  const canLoadMore =
    !!meta && meta.totalPages > 1 && page < meta.totalPages && filter === 'all';

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          value={filter}
          onValueChange={(v) => setFilter(v as NotificationFilter)}
          className="w-full sm:w-auto"
        >
          <TabsList className="h-9 w-full sm:w-auto">
            <TabsTrigger value="all" className="flex-1 sm:flex-initial">
              All
            </TabsTrigger>
            <TabsTrigger value="unread" className="flex-1 sm:flex-initial">
              Unread
            </TabsTrigger>
            <TabsTrigger value="read" className="flex-1 sm:flex-initial">
              Read
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Button
          variant="outline"
          size="sm"
          className="shrink-0 self-end sm:self-auto"
          onClick={() => markAllAsRead()}
          disabled={isPending}
        >
          <CheckCheck className="mr-2 h-4 w-4" />
          Mark all as read
        </Button>
      </div>

      {filteredNotifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-sm text-muted-foreground">
          {filter === 'unread' && <p>No unread notifications in the loaded pages.</p>}
          {filter === 'read' && <p>No read notifications in the loaded pages.</p>}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredNotifications.map((notification) => (
            <NotificationItem key={notification.id} notification={notification} />
          ))}
        </div>
      )}

      {!isLoading && accumulated.length > 0 && canLoadMore && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={isFetching}
          >
            {isFetching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading…
              </>
            ) : (
              'Load more'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
