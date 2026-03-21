'use client';

import { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotificationsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Notifications error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <AlertCircle className="h-10 w-10 text-destructive" />
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <p className="text-sm text-muted-foreground max-w-md text-center">
        {error.message || 'Failed to load notifications. Please try again.'}
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
