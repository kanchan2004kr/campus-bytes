'use client';

import { useState } from 'react';
import { Button, Field, Input, Switch, cn, toast } from '@campus-bytes/ui';
import { PageHeader } from '@/components/admin/page-header';

export default function AdminSettingsPage() {
  const [commission, setCommission] = useState('12');
  const [deliveryFee, setDeliveryFee] = useState('20');
  const [convenienceFee, setConvenienceFee] = useState('5');
  const [openTime, setOpenTime] = useState('08:00');
  const [closeTime, setCloseTime] = useState('23:00');
  const [autoAssignCart, setAutoAssignCart] = useState(true);
  const [dirty, setDirty] = useState(false);

  const m = <T,>(set: (v: T) => void) => (v: T) => { set(v); setDirty(true); };

  return (
    <div>
      <PageHeader title="Settings" description="Platform-wide configuration for NIMS University." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Commission & fees" description="Applied to every completed order.">
          <div className="grid grid-cols-3 gap-3">
            <Field label="Commission %" htmlFor="comm">
              <Input id="comm" inputMode="numeric" value={commission} onChange={(e) => m(setCommission)(e.target.value.replace(/[^\d]/g, ''))} />
            </Field>
            <Field label="Delivery ₹" htmlFor="del">
              <Input id="del" inputMode="numeric" value={deliveryFee} onChange={(e) => m(setDeliveryFee)(e.target.value.replace(/[^\d]/g, ''))} />
            </Field>
            <Field label="Convenience ₹" htmlFor="conv">
              <Input id="conv" inputMode="numeric" value={convenienceFee} onChange={(e) => m(setConvenienceFee)(e.target.value.replace(/[^\d]/g, ''))} />
            </Field>
          </div>
        </Section>

        <Section title="Campus hours" description="Ordering is available within these hours.">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Opens" htmlFor="open"><Input id="open" type="time" value={openTime} onChange={(e) => m(setOpenTime)(e.target.value)} /></Field>
            <Field label="Closes" htmlFor="close"><Input id="close" type="time" value={closeTime} onChange={(e) => m(setCloseTime)(e.target.value)} /></Field>
          </div>
        </Section>

        <Section title="Delivery" description="How carts are assigned when an order is ready.">
          <div className="flex items-center justify-between rounded-md border border-line px-3.5 py-3">
            <div>
              <p className="text-sm font-medium text-ink-900">Auto-assign nearest available cart</p>
              <p className="text-xs text-ink-400">If off, restaurants pick a cart manually.</p>
            </div>
            <Switch checked={autoAssignCart} onChange={m(setAutoAssignCart)} label="Auto-assign cart" />
          </div>
          <div className="rounded-md border border-dashed border-line bg-surface-cream p-3 text-xs text-ink-600">
            Payment is online only (Razorpay). Cash on delivery is disabled platform-wide.
          </div>
        </Section>

        <Section title="Payments" description="Configured provider for this campus.">
          <div className="flex items-center justify-between rounded-md border border-line px-3.5 py-3">
            <div>
              <p className="text-sm font-medium text-ink-900">Razorpay</p>
              <p className="text-xs text-ink-400">UPI · Card · Wallet — server-verified capture</p>
            </div>
            <span className="rounded-pill bg-success-soft px-2.5 py-1 text-2xs font-semibold text-success">Connected in Phase 10</span>
          </div>
        </Section>
      </div>

      <div className={cn('sticky bottom-0 -mx-4 mt-6 flex items-center justify-end gap-3 border-t border-line bg-bg/95 px-4 py-3 backdrop-blur md:-mx-6 md:px-6', !dirty && 'pointer-events-none opacity-0')}>
        <span className="mr-auto text-sm text-ink-600">You have unsaved changes</span>
        <Button variant="ghost" onClick={() => setDirty(false)}>Discard</Button>
        <Button onClick={() => { setDirty(false); toast({ tone: 'success', title: 'Settings saved' }); }}>Save changes</Button>
      </div>
    </div>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-line bg-surface p-5 shadow-sm">
      <h2 className="font-display text-lg font-semibold text-ink-900">{title}</h2>
      {description && <p className="mb-4 mt-0.5 text-sm text-ink-600">{description}</p>}
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}
