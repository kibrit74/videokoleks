'use client';

import { BottomNav } from '@/components/bottom-nav';
import { useSendIntent } from '@/hooks/use-send-intent';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useSendIntent();

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 pb-32 md:pb-0 pb-safe">{children}</main>
      <BottomNav />
    </div>
  );
}
