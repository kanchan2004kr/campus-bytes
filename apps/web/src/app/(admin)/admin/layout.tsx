import type { Metadata } from 'next';
import { AdminChrome } from '@/components/admin/chrome';
import { RequireRole } from '@/components/auth/require-role';

export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s · Campus Bytes Admin' },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole role="admin">
      <AdminChrome>{children}</AdminChrome>
    </RequireRole>
  );
}
