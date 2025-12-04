import { BottomNav } from '@/components/bottom-nav';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 pb-16 md:pb-0 pb-safe">{children}</main>
      <BottomNav />
    </div>
  );
}
