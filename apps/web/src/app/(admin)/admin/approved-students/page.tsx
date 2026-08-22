'use client';

import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Upload } from 'lucide-react';
import { Badge, Button, Input, Skeleton, Table, THead, TBody, TR, TH, TD, toast } from '@campus-bytes/ui';
import { PageHeader } from '@/components/admin/page-header';
import { getApprovedStudents, importApprovedStudents } from '@/data/admin';
import { ApiError } from '@/lib/api-client';

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'brand' | 'success' | 'muted' }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <p className="text-2xs font-semibold uppercase tracking-wider text-ink-400">{label}</p>
      <p
        className={
          'mt-1 font-display text-2xl font-bold tabular-nums ' +
          (tone === 'success' ? 'text-success' : tone === 'muted' ? 'text-ink-500' : 'text-ink-900')
        }
      >
        {value.toLocaleString()}
      </p>
    </div>
  );
}

export default function ApprovedStudentsPage() {
  const qc = useQueryClient();
  const [query, setQuery] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['approved-students', query],
    queryFn: () => getApprovedStudents(query),
  });

  const importMut = useMutation({
    mutationFn: (csv: string) => importApprovedStudents(csv),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['approved-students'] });
      toast({
        tone: 'success',
        title: 'Import complete',
        description: `+${r.inserted} new, ${r.updated} updated · ${r.duplicates} dupes, ${r.invalid} invalid · ${r.total} total.`,
      });
    },
    onError: (e) => toast({ tone: 'error', title: 'Import failed', description: e instanceof ApiError ? e.message : 'Could not import.' }),
  });

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const text = await file.text();
    importMut.mutate(text);
  };

  return (
    <div>
      <PageHeader
        title="Approved Students"
        description="The authorized-student roster (source of truth for registration). Upload adds/updates records — it never creates user accounts or duplicates."
        action={
          <>
            <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={onFile} />
            <Button size="sm" loading={importMut.isPending} onClick={() => fileRef.current?.click()}>
              <Upload className="h-4 w-4" /> Upload CSV
            </Button>
          </>
        }
      />

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label="Total approved" value={data?.total ?? 0} />
        <Stat label="Registered" value={data?.registered ?? 0} tone="success" />
        <Stat label="Not yet registered" value={data?.notRegistered ?? 0} tone="muted" />
      </div>

      <div className="mb-3 flex items-center gap-3">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by Student ID or name…"
          className="max-w-sm"
        />
        {query && data && (
          <span className="text-sm text-ink-500">{data.matched.toLocaleString()} match{data.matched === 1 ? '' : 'es'}</span>
        )}
      </div>

      <div className="rounded-lg border border-line bg-surface shadow-sm">
        {isLoading ? (
          <div className="p-5"><Skeleton className="h-64 rounded-md" /></div>
        ) : (
          <Table>
            <THead>
              <TR className="hover:bg-transparent">
                <TH>Student ID</TH><TH>Name</TH><TH>Status</TH>
              </TR>
            </THead>
            <TBody>
              {data?.rows.map((r) => (
                <TR key={r.studentId}>
                  <TD className="font-mono text-sm text-ink-800">{r.studentId}</TD>
                  <TD className="text-ink-800">{r.name}</TD>
                  <TD>
                    {r.registered ? (
                      <Badge tone="success" size="sm" dot>Registered</Badge>
                    ) : (
                      <Badge tone="neutral" size="sm">Not registered</Badge>
                    )}
                  </TD>
                </TR>
              ))}
              {data && data.rows.length === 0 && (
                <TR><TD colSpan={3} className="py-8 text-center text-sm text-ink-400">No approved students match “{query}”.</TD></TR>
              )}
            </TBody>
          </Table>
        )}
      </div>
      {data && data.matched > data.rows.length && (
        <p className="mt-3 text-center text-xs text-ink-400">
          Showing first {data.rows.length} of {data.matched.toLocaleString()} — refine your search to narrow results.
        </p>
      )}
    </div>
  );
}
