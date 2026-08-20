'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Field, Input, Select, Textarea, Switch, toast, cn } from '@campus-bytes/ui';
import { CURRENT_RESTAURANT } from '@/data/restaurant';
import { logout } from '@/lib/auth-api';

export default function RestaurantSettingsPage() {
  const router = useRouter();
  const [name, setName] = useState(CURRENT_RESTAURANT.name);
  const [cuisine, setCuisine] = useState(CURRENT_RESTAURANT.cuisine);
  const [description, setDescription] = useState(
    'All-day chai, snacks & combos served hot near the north block.',
  );
  const [defaultPrep, setDefaultPrep] = useState('15');
  const [openTime, setOpenTime] = useState('08:00');
  const [closeTime, setCloseTime] = useState('23:00');
  const [autoAccept, setAutoAccept] = useState(false);
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [dirty, setDirty] = useState(false);

  const mark = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setDirty(true);
  };

  const save = () => {
    // Phase 7: PATCH /restaurant/settings & /restaurant/status
    setDirty(false);
    toast({ tone: 'success', title: 'Settings saved' });
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-900">Settings</h1>
        <p className="text-sm text-ink-600">Manage your outlet profile and operations.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Section title="Outlet profile" description="Shown to students in discovery.">
            <Field label="Outlet name" htmlFor="s-name">
              <Input id="s-name" value={name} onChange={(e) => mark(setName)(e.target.value)} />
            </Field>
            <Field label="Cuisine / tagline" htmlFor="s-cuisine">
              <Input id="s-cuisine" value={cuisine} onChange={(e) => mark(setCuisine)(e.target.value)} />
            </Field>
            <Field label="Description" htmlFor="s-desc">
              <Textarea id="s-desc" value={description} onChange={(e) => mark(setDescription)(e.target.value)} maxLength={280} />
            </Field>
          </Section>

          <Section title="Operations" description="Defaults that speed up your kitchen.">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Default prep time" htmlFor="s-prep">
                <Select id="s-prep" value={defaultPrep} onChange={(e) => mark(setDefaultPrep)(e.target.value)}>
                  {[10, 15, 20, 25, 30].map((m) => (
                    <option key={m} value={m}>
                      {m} minutes
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Opens" htmlFor="s-open">
                  <Input id="s-open" type="time" value={openTime} onChange={(e) => mark(setOpenTime)(e.target.value)} />
                </Field>
                <Field label="Closes" htmlFor="s-close">
                  <Input id="s-close" type="time" value={closeTime} onChange={(e) => mark(setCloseTime)(e.target.value)} />
                </Field>
              </div>
            </div>

            <ToggleRow
              label="Auto-accept new orders"
              hint="Skip manual accept; still set default prep time."
              checked={autoAccept}
              onChange={mark(setAutoAccept)}
            />
            <ToggleRow
              label="Sound alert on new order"
              hint="Play a chime when an order arrives."
              checked={soundAlerts}
              onChange={mark(setSoundAlerts)}
            />
          </Section>
        </div>

        <aside className="flex flex-col gap-4">
          <div className="rounded-lg border border-line bg-surface p-4 shadow-sm">
            <p className="text-2xs font-semibold uppercase tracking-wide text-ink-400">Account</p>
            <p className="mt-1 text-sm text-ink-900">owner@vistacolline.campus</p>
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
          <div className="rounded-lg border border-dashed border-line bg-surface-cream p-4 text-xs text-ink-600">
            Password &amp; email changes require re-verification and land with authentication in Phase 8.
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
        <Button variant="ghost" onClick={() => setDirty(false)}>
          Discard
        </Button>
        <Button onClick={save}>Save changes</Button>
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

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-line px-3.5 py-3">
      <div>
        <p className="text-sm font-medium text-ink-900">{label}</p>
        <p className="text-xs text-ink-400">{hint}</p>
      </div>
      <Switch checked={checked} onChange={onChange} label={label} />
    </div>
  );
}
