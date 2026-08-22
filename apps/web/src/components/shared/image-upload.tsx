'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { cn } from '@campus-bytes/ui';
import { CLOUDINARY_READY, uploadImage } from '@/lib/cloudinary';

/**
 * Reusable image uploader. Uploads directly to Cloudinary (unsigned) and returns
 * the hosted URL via onChange. Shows a live preview; validates type/size in the
 * upload helper. When Cloudinary isn't configured yet it degrades to a disabled
 * state with a hint (no crash).
 */
export function ImageUpload({
  value,
  onChange,
  label,
  aspect = 'video',
  className,
}: {
  value?: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  aspect?: 'video' | 'square';
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = () => inputRef.current?.click();

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const url = await uploadImage(file);
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {label && <span className="text-sm font-medium text-ink-700">{label}</span>}
      <div
        className={cn(
          'relative overflow-hidden rounded-lg border border-dashed border-line bg-surface-cream',
          aspect === 'video' ? 'aspect-video' : 'aspect-square',
        )}
      >
        {value ? (
          <>
            <Image src={value} alt={label ?? 'image'} fill sizes="400px" className="object-cover" />
            <button
              type="button"
              onClick={() => onChange(null)}
              aria-label="Remove image"
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-ink-900/60 text-white hover:bg-ink-900/80"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={pick}
            disabled={busy || !CLOUDINARY_READY}
            className="flex h-full w-full flex-col items-center justify-center gap-1 text-ink-500 hover:text-brand-600 disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-6 w-6 animate-spin" /> : <ImagePlus className="h-6 w-6" />}
            <span className="text-xs font-medium">{busy ? 'Uploading…' : 'Upload image'}</span>
          </button>
        )}
        {value && (
          <button
            type="button"
            onClick={pick}
            disabled={busy || !CLOUDINARY_READY}
            className="absolute bottom-2 right-2 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-brand-700 shadow hover:bg-white disabled:opacity-60"
          >
            {busy ? 'Uploading…' : 'Replace'}
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
      {error && <p className="text-xs text-error">{error}</p>}
      {!CLOUDINARY_READY && (
        <p className="text-2xs text-ink-400">
          Image upload isn’t configured yet — add Cloudinary keys in Vercel to enable it.
        </p>
      )}
    </div>
  );
}
