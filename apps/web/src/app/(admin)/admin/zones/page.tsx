'use client';

import { useQuery } from '@tanstack/react-query';
import { Building2, MapPin } from 'lucide-react';
import { Badge, Skeleton, Table, THead, TBody, TR, TH, TD } from '@campus-bytes/ui';
import { getHostels, getZones } from '@/data/admin';
import { PageHeader } from '@/components/admin/page-header';

export default function ZonesPage() {
  const hostels = useQuery({ queryKey: ['admin-hostels'], queryFn: getHostels });
  const zones = useQuery({ queryKey: ['admin-zones'], queryFn: getZones });

  return (
    <div>
      <PageHeader title="Hostels & zones" description="Approved campus delivery locations students can choose from." />

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-lg border border-line bg-surface shadow-sm lg:col-span-2">
          <div className="flex items-center gap-2 border-b border-line px-5 py-4">
            <Building2 className="h-4 w-4 text-brand-600" />
            <h2 className="font-display text-lg font-semibold text-ink-900">Hostels</h2>
          </div>
          {hostels.isLoading ? (
            <div className="p-5"><Skeleton className="h-40 rounded-md" /></div>
          ) : (
            <Table>
              <THead>
                <TR className="hover:bg-transparent"><TH>Hostel</TH><TH>Zone</TH><TH>Rooms</TH></TR>
              </THead>
              <TBody>
                {hostels.data?.map((h) => (
                  <TR key={h.id}>
                    <TD className="font-medium">{h.name}</TD>
                    <TD className="text-ink-700">{h.zoneName}</TD>
                    <TD className="tabular-nums">{h.rooms}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </section>

        <section className="rounded-lg border border-line bg-surface shadow-sm">
          <div className="flex items-center gap-2 border-b border-line px-5 py-4">
            <MapPin className="h-4 w-4 text-brand-600" />
            <h2 className="font-display text-lg font-semibold text-ink-900">Campus zones</h2>
          </div>
          <ul className="divide-y divide-line">
            {zones.isLoading
              ? Array.from({ length: 3 }).map((_, i) => <li key={i} className="p-4"><Skeleton className="h-8 rounded-md" /></li>)
              : zones.data?.map((z) => (
                  <li key={z.id} className="flex items-center justify-between px-5 py-3.5">
                    <span className="text-sm font-medium text-ink-900">{z.name}</span>
                    {z.isPickupPoint && <Badge tone="info" size="sm">Pickup point</Badge>}
                  </li>
                ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
