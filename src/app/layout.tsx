import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { QueryProvider } from '@/shared/providers/query-provider';
import { ThemeProvider } from '@/shared/providers/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';
import '@/styles/globals.css';

const geist = GeistSans;

export const metadata: Metadata = {
  title: 'Trackify Agile',
  description: 'Agile issue tracker',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn('font-sans', geist.variable)} suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>
          <QueryProvider>
            {children}
            <Toaster />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
