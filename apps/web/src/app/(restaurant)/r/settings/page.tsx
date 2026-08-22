'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Button, Field, Input, Textarea, toast, cn } from '@campus-bytes/ui';
import { getMyRestaurant, updateRestaurantProfile } from '@/data/restaurant';
import { ImageUpload } from '@/components/shared/image-upload';
import { logout } from '@/lib/auth-api';

export default function RestaurantSettingsPage() {
  const router = useRouter();
  const { data, isLoading, refetch } = useQuery({ queryKey: ['r-profile'], queryFn: getMyRestaurant });

  const [name, setName] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [description, setDescription] = useState('');
  const [hours, setHours] = useState('');
  const [phone, setPhone] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  // Seed the form once the profile loads.
  useEffect(() => {
    if (!data) return;
    setName(data.name ?? '');
    setCuisine(data.cuisine ?? '');
    setDescription(data.description ?? '');
    setHours(data.hours ?? '');
    setPhone(data.phone ?? '');
    setLogoUrl(data.logoUrl ?? null);
    setCoverUrl(data.coverUrl ?? null);
    setDirty(false);
  }, [data]);

  const mark =
    <T,>(setter: (v: T) => void) =>
    (v: T) => {
      setter(v);
      setDirty(true);
    };

  const save = async () => {
    setSaving(true);
    try {
      await updateRestaurantProfile({ name, cuisine, description, hours, phone, logoUrl, coverUrl });
      await refetch();
      setDirty(false);
      toast({ tone: 'success', title: 'Settings saved', description: 'Your outlet profile is updated.' });
    } catch (e) {
      toast({ tone: 'error', title: 'Could not save', description: e instanceof Error ? e.message : 'Try again.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-900">Settings</h1>
        <p className="text-sm text-ink-600">Manage your outlet profile, photos and details.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Section title="Restaurant photos" description="Shown to students on the app.">
            <ImageUpload label="Cover / banner photo" value={coverUrl} onChange={mark(setCoverUrl)} aspect="video" />
            <div className="max-w-[200px]">
              <ImageUpload label="Logo" value={logoUrl} onChange={mark(setLogoUrl)} aspect="square" />
            </div>
          </Section>

          <Section title="Outlet profile" description="Shown to students in discovery.">
            <Field label="Outlet name" htmlFor="s-name">
              <Input id="s-name" value={name} onChange={(e) => mark(setName)(e.target.value)} disabled={isLoading} />
            </Field>
            <Field label="Cuisine / tagline" htmlFor="s-cuisine">
              <Input id="s-cuisine" value={cuisine} onChange={(e) => mark(setCuisine)(e.target.value)} disabled={isLoading} />
            </Field>
            <Field label="Description" htmlFor="s-desc">
              <Textarea id="s-desc" value={description} onChange={(e) => mark(setDescription)(e.target.value)} maxLength={280} disabled={isLoading} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Opening hours" htmlFor="s-hours">
                <Input id="s-hours" value={hours} onChange={(e) => mark(setHours)(e.target.value)} placeholder="8:00 AM – 11:00 PM" disabled={isLoading} />
              </Field>
              <Field label="Contact phone" htmlFor="s-phone">
                <Input id="s-phone" value={phone} onChange={(e) => mark(setPhone)(e.target.value)} placeholder="9XXXXXXXXX" disabled={isLoading} />
              </Field>
            </div>
          </Section>
        </div>

        <aside className="flex flex-col gap-4">
          <div className="rounded-lg border border-line bg-surface p-4 shadow-sm">
            <p className="text-2xs font-semibold uppercase tracking-wide text-ink-400">Account</p>
            <p className="text-xs text-ink-400">Restaurant owner · NIMS University</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 w-full text-error"
              onClick={async () => {
                await logout();
                router.replace('/login?next=restaurant');
              }}
            >
              Log out
            </Button>
          </div>
        </aside>
      </div>

      {/* Sticky save bar */}
      <div
        className={cn(
          'sticky bottom-0 -mx-4 flex items-center justify-end gap-3 border-t border-line bg-bg/95 px-4 py-3 backdrop-blur md:-mx-6 md:px-6',
          !dirty && 'pointer-events-none opacity-0',
        )}
      >
        <span className="mr-auto text-sm text-ink-600">You have unsaved changes</span>
        <Button variant="ghost" onClick={() => refetch()}>
          Discard
        </Button>
        <Button onClick={save} loading={saving}>
          Save changes
        </Button>
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
