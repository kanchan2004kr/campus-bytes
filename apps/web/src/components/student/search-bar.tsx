'use client';

import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@campus-bytes/ui';

export function SearchBar({ autoFocus, defaultValue = '' }: { autoFocus?: boolean; defaultValue?: string }) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        router.push(`/food?q=${encodeURIComponent(value.trim())}`);
      }}
      className={cn(
        'flex items-center gap-2.5 rounded-md border border-line-strong bg-surface px-3.5',
        'focus-within:border-brand-400',
      )}
    >
      <Search className="h-4.5 w-4.5 shrink-0 text-ink-400" />
      <input
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search biryani, chai, Maggie…"
        className="h-11 w-full bg-transparent text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none"
        aria-label="Search food or outlets"
      />
    </form>
  );
}
