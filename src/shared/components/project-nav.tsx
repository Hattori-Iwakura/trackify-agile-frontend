'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, List, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProjectNavProps { projectId: string; }

const tabs = [
  { segment: 'board', label: 'Board', icon: LayoutGrid },
  { segment: 'backlog', label: 'Backlog', icon: List },
  { segment: 'settings', label: 'Settings', icon: Settings },
];

export function ProjectNav({ projectId }: ProjectNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 border-b px-4">
      {tabs.map((tab) => {
        const href = `/projects/${projectId}/${tab.segment}`;
        const isActive = pathname.startsWith(href);
        return (
          <Link
            key={tab.segment}
            href={href}
            className={cn(
              'flex items-center gap-2 border-b-2 px-3 py-2 text-sm transition-colors',
              isActive
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
