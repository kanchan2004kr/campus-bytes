import type { Metadata } from 'next';
import { StudentTopBar } from '@/components/student/top-bar';
import { StudentBottomNav } from '@/components/student/bottom-nav';
import { RequireRole } from '@/components/auth/require-role';

export const metadata: Metadata = {
  title: 'Home',
};

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole role="student">
      <div className="min-h-dvh bg-surface-cream">
        {/* Mobile-first single column; widens to a centered feed on desktop. */}
        <div className="mx-auto flex min-h-dvh w-full max-w-content flex-col bg-bg shadow-sm md:my-0">
          <StudentTopBar />
          <main className="flex-1 pb-24 md:pb-10">{children}</main>
          <StudentBottomNav />
        </div>
      </div>
    </RequireRole>
  );
}
