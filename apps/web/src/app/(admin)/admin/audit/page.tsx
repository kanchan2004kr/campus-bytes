'use client';

import { useQuery } from '@tanstack/react-query';
import { ScrollText } from 'lucide-react';
import { Skeleton } from '@campus-bytes/ui';
import { getAuditLog } from '@/data/admin';
import { PageHeader } from '@/components/admin/page-header';
import { formatRelative } from '@/lib/format';

export default function AdminAuditPage() {
  const { data, isLoading } = useQuery({ queryKey: ['admin-audit'], queryFn: getAuditLog });

  return (
    <div>
      <PageHeader title="Audit logs" description="Immutable trail of all privileged actions." />

      <div className="rounded-lg border border-line bg-surface p-2 shadow-sm">
        {isLoading ? (
          <div className="p-4"><Skeleton className="h-64 rounded-md" /></div>
        ) : (
          <ol className="relative ml-3 border-l border-line">
            {data?.map((e) => (
              <li key={e.id} className="relative py-3 pl-6">
                <span className="absolute -left-[7px] top-4 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-surface bg-brand-500" />
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-sm font-semibold text-ink-900">{e.action}</span>
                  <span className="text-sm text-ink-600">· {e.target}</span>
                </div>
                <p className="mt-0.5 text-2xs text-ink-400">
                  {e.actor} · {formatRelative(e.at)}
                </p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
