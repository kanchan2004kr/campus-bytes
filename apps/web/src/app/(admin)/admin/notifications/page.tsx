'use client';

import { useMutation } from '@tanstack/react-query';
import { Megaphone, Send } from 'lucide-react';
import { useState } from 'react';
import { Button, Field, Select, Textarea, toast } from '@campus-bytes/ui';
import { broadcast } from '@/data/admin';
import { PageHeader } from '@/components/admin/page-header';

const RECENT = [
  { audience: 'All students', message: 'Diwali special combos live at 5 outlets today! 🎉', at: 'Yesterday' },
  { audience: 'All restaurants', message: 'Peak-hour reminder: keep prep times updated during 8–10 PM.', at: '3 days ago' },
];

export default function AdminNotificationsPage() {
  const [audience, setAudience] = useState('All students');
  const [message, setMessage] = useState('');

  const send = useMutation({
    mutationFn: () => broadcast(audience, message),
    onSuccess: () => {
      toast({ tone: 'success', title: 'Announcement sent', description: `Delivered to ${audience.toLowerCase()}.` });
      setMessage('');
    },
  });

  return (
    <div>
      <PageHeader title="Notifications" description="Broadcast announcements to students or restaurants." />

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-lg border border-line bg-surface p-5 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-brand-600" />
            <h2 className="font-display text-lg font-semibold text-ink-900">New broadcast</h2>
          </div>
          <div className="flex flex-col gap-4">
            <Field label="Audience" htmlFor="aud">
              <Select id="aud" value={audience} onChange={(e) => setAudience(e.target.value)}>
                <option>All students</option>
                <option>All restaurants</option>
                <option>Everyone</option>
              </Select>
            </Field>
            <Field label="Message" htmlFor="msg" hint={`${message.length}/280`}>
              <Textarea id="msg" value={message} onChange={(e) => setMessage(e.target.value.slice(0, 280))} placeholder="Write your announcement…" />
            </Field>
            <div className="flex justify-end">
              <Button disabled={message.trim().length < 3} loading={send.isPending} onClick={() => send.mutate()}>
                <Send className="h-4 w-4" /> Send broadcast
              </Button>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-line bg-surface p-5 shadow-sm">
          <h2 className="mb-4 font-display text-lg font-semibold text-ink-900">Recent</h2>
          <ul className="flex flex-col gap-3">
            {RECENT.map((r, i) => (
              <li key={i} className="rounded-md border border-line p-3">
                <p className="text-2xs font-semibold uppercase tracking-wide text-brand-700">{r.audience}</p>
                <p className="mt-1 text-sm text-ink-900">{r.message}</p>
                <p className="mt-1 text-2xs text-ink-400">{r.at}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
