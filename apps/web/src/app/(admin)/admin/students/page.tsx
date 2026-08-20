'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { Badge, Button, Skeleton, Table, THead, TBody, TR, TH, TD, toast } from '@campus-bytes/ui';
import { getStudents, setStudentBlocked } from '@/data/admin';
import { PageHeader } from '@/components/admin/page-header';
import { formatRelative } from '@/lib/format';

export default function AdminStudentsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin-students'], queryFn: getStudents });
  const [q, setQ] = useState('');

  const mut = useMutation({
    mutationFn: ({ id, blocked }: { id: string; blocked: boolean }) => setStudentBlocked(id, blocked),
    onSuccess: (s) => {
      qc.invalidateQueries({ queryKey: ['admin-students'] });
      toast({ tone: s?.status === 'blocked' ? 'warning' : 'success', title: `${s?.name} ${s?.status === 'blocked' ? 'blocked' : 'unblocked'}` });
    },
  });

  const filtered = (data ?? []).filter(
    (s) => s.name.toLowerCase().includes(q.toLowerCase()) || s.email.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div>
      <PageHeader
        title="Students"
        description="View, search, and manage campus eligibility."
        action={
          <div className="flex items-center gap-2 rounded-md border border-line-strong bg-surface px-3">
            <Search className="h-4 w-4 text-ink-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search students" className="h-10 w-56 bg-transparent text-sm focus:outline-none" />
          </div>
        }
      />

      <div className="rounded-lg border border-line bg-surface shadow-sm">
        {isLoading ? (
          <div className="p-5"><Skeleton className="h-64 rounded-md" /></div>
        ) : (
          <Table>
            <THead>
              <TR className="hover:bg-transparent">
                <TH>Student</TH><TH>Hostel / Room</TH><TH>Orders</TH><TH>Joined</TH><TH>Status</TH><TH></TH>
              </TR>
            </THead>
            <TBody>
              {filtered.map((s) => (
                <TR key={s.id}>
                  <TD>
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-peach text-2xs font-bold text-brand-700">
                        {s.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </span>
                      <div>
                        <p className="font-medium text-ink-900">{s.name}</p>
                        <p className="text-2xs text-ink-400">{s.email}</p>
                      </div>
                    </div>
                  </TD>
                  <TD className="text-ink-700">{s.hostelName} · {s.roomNo}</TD>
                  <TD className="tabular-nums">{s.ordersCount}</TD>
                  <TD className="whitespace-nowrap text-ink-600">{formatRelative(s.joinedAt)}</TD>
                  <TD>
                    <Badge tone={s.status === 'active' ? 'success' : 'error'} size="sm" dot className="capitalize">
                      {s.status}
                    </Badge>
                  </TD>
                  <TD className="text-right">
                    {s.status === 'active' ? (
                      <Button variant="ghost" size="sm" className="text-error" onClick={() => mut.mutate({ id: s.id, blocked: true })}>
                        Block
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => mut.mutate({ id: s.id, blocked: false })}>
                        Unblock
                      </Button>
                    )}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </div>
    </div>
  );
}
