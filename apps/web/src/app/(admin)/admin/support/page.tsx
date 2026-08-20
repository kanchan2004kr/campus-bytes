'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Store, User } from 'lucide-react';
import { Badge, Button, Skeleton, toast } from '@campus-bytes/ui';
import { getTickets, resolveTicket } from '@/data/admin';
import { PageHeader } from '@/components/admin/page-header';
import { formatRelative } from '@/lib/format';

export default function AdminSupportPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin-tickets'], queryFn: getTickets });

  const resolve = useMutation({
    mutationFn: resolveTicket,
    onSuccess: (t) => {
      qc.invalidateQueries({ queryKey: ['admin-tickets'] });
      qc.invalidateQueries({ queryKey: ['admin-overview'] });
      toast({ tone: 'success', title: `${t?.code} resolved` });
    },
  });

  const open = (data ?? []).filter((t) => t.status === 'open');
  const resolved = (data ?? []).filter((t) => t.status === 'resolved');

  return (
    <div>
      <PageHeader title="Support" description="Triage and resolve student and restaurant issues." />

      {isLoading ? (
        <Skeleton className="h-64 rounded-lg" />
      ) : (
        <div className="flex flex-col gap-6">
          <Section title={`Open (${open.length})`}>
            {open.length === 0 ? (
              <p className="rounded-lg border border-dashed border-line bg-surface p-6 text-center text-sm text-ink-400">
                No open tickets. 🎉
              </p>
            ) : (
              open.map((t) => (
                <div key={t.id} className="flex items-center gap-3 rounded-lg border border-line bg-surface p-4 shadow-sm">
                  <span className="flex h-9 w-9 items-center justify-center rounded-md bg-surface-cream text-ink-600">
                    {t.role === 'restaurant' ? <Store className="h-4.5 w-4.5" /> : <User className="h-4.5 w-4.5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink-900">{t.subject}</p>
                    <p className="text-2xs text-ink-400">{t.code} · {t.from} · {formatRelative(t.at)}</p>
                  </div>
                  <Button variant="outline" size="sm" loading={resolve.isPending && resolve.variables === t.id} onClick={() => resolve.mutate(t.id)}>
                    Resolve
                  </Button>
                </div>
              ))
            )}
          </Section>

          <Section title={`Resolved (${resolved.length})`}>
            {resolved.map((t) => (
              <div key={t.id} className="flex items-center gap-3 rounded-lg border border-line bg-surface/60 p-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-surface-cream text-ink-400">
                  {t.role === 'restaurant' ? <Store className="h-4.5 w-4.5" /> : <User className="h-4.5 w-4.5" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ink-700">{t.subject}</p>
                  <p className="text-2xs text-ink-400">{t.code} · {t.from} · {formatRelative(t.at)}</p>
                </div>
                <Badge tone="success" size="sm" dot>Resolved</Badge>
              </div>
            ))}
          </Section>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-400">{title}</h2>
      <div className="flex flex-col gap-2.5">{children}</div>
    </section>
  );
}
