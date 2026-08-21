'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { buttonVariants, cn } from '@campus-bytes/ui';
import { getStudentProfile } from '@/data/client';

// Food floating "charo taraf" (all around) the character. Positions are % within
// the banner; sizes/animation scale down on small screens via clamp().
const FOODS: { e: string; top: string; left: string; size: number; delay: number }[] = [
  { e: '🍔', top: '10%', left: '60%', size: 46, delay: 0 },
  { e: '🥤', top: '30%', left: '86%', size: 40, delay: 0.6 },
  { e: '🍜', top: '64%', left: '82%', size: 44, delay: 1.2 },
  { e: '🌮', top: '78%', left: '62%', size: 40, delay: 0.3 },
  { e: '🍕', top: '48%', left: '52%', size: 34, delay: 0.9 },
  { e: '🍗', top: '84%', left: '46%', size: 30, delay: 1.5 },
  { e: '🧅', top: '20%', left: '48%', size: 26, delay: 1.8 },
  { e: '🍟', top: '58%', left: '92%', size: 30, delay: 0.4 },
  { e: '🌶️', top: '16%', left: '40%', size: 22, delay: 1.1 },
];

export function Hero() {
  const { data } = useQuery({ queryKey: ['student-profile'], queryFn: getStudentProfile });
  const displayName = data?.name?.trim() || 'there';

  return (
    <section className="relative w-full overflow-hidden rounded-2xl text-white h-[300px] sm:h-[340px] md:h-[400px] lg:h-[460px]">
      {/* Float animation (scoped keyframes). */}
      <style>{`@keyframes cbFloat{0%,100%{transform:translateY(0) rotate(-2deg)}50%{transform:translateY(-10px) rotate(2deg)}}`}</style>

      {/* Rich orange gradient + warm glow — the transparent character sits on this,
          so the whole banner is one seamless scene with no box or cut line. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 95% at 72% 42%, rgba(255,158,80,0.6) 0%, rgba(233,85,28,0) 55%), linear-gradient(120deg, #d9401a 0%, #e9551c 48%, #f0562d 100%)',
        }}
      />

      {/* Soft decorative blur blobs for depth. */}
      <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-16 left-1/3 h-44 w-44 rounded-full bg-amber-300/20 blur-2xl" />

      {/* Character — transparent PNG, so it blends perfectly onto the orange. Kept
          `contain` + bottom-anchored so it is never cropped on any screen. */}
      <div className="pointer-events-none absolute inset-y-0 right-0 flex w-[52%] items-end justify-center sm:w-[52%] md:w-[50%] lg:w-[48%]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/hero-boy.png"
          alt=""
          aria-hidden
          className="h-[104%] w-full object-contain object-bottom drop-shadow-[0_10px_24px_rgba(120,30,0,0.25)]"
          onError={(ev) => {
            // If the asset isn't added yet, hide gracefully (no broken icon).
            (ev.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
      </div>

      {/* Floating food — all around the character. */}
      {FOODS.map((f, i) => (
        <span
          key={i}
          aria-hidden
          className="pointer-events-none absolute select-none drop-shadow-[0_6px_10px_rgba(120,30,0,0.35)]"
          style={{
            top: f.top,
            left: f.left,
            fontSize: `clamp(${Math.round(f.size * 0.6)}px, ${f.size / 14}vw, ${f.size}px)`,
            animation: `cbFloat ${3.4 + (i % 4) * 0.5}s ease-in-out ${f.delay}s infinite`,
          }}
        >
          {f.e}
        </span>
      ))}

      {/* Left scrim keeps text crisp over the scene. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(to right, rgba(200,58,18,0.95) 0%, rgba(217,64,20,0.7) 30%, rgba(233,85,28,0.15) 52%, rgba(233,85,28,0) 64%)',
        }}
      />

      {/* Subtle bottom wave. */}
      <svg
        aria-hidden
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-8 w-full sm:h-10 md:h-12"
      >
        <path d="M0,72 C240,116 480,116 720,84 C960,52 1200,52 1440,84 L1440,120 L0,120 Z" fill="rgba(255,255,255,0.10)" />
        <path d="M0,92 C240,120 480,120 720,100 C960,80 1200,80 1440,100 L1440,120 L0,120 Z" fill="rgba(255,255,255,0.08)" />
      </svg>

      {/* Text + CTA. */}
      <div className="relative z-10 flex h-full max-w-[52%] flex-col justify-center px-5 py-6 sm:max-w-[52%] md:max-w-[50%] md:px-8 md:py-10 lg:max-w-[46%]">
        <p className="text-xs font-medium text-white/90 sm:text-sm">Hey, {displayName}</p>
        <h1 className="mt-1.5 font-display text-xl font-bold leading-[1.12] drop-shadow-sm sm:text-2xl md:mt-2 md:text-3xl lg:text-[2.6rem] lg:leading-[1.08]">
          Skip the queue.
          <br />
          Eat from your room.
        </h1>
        <p className="mt-2 line-clamp-3 text-xs text-white/90 sm:text-sm md:mt-3 md:line-clamp-none lg:text-base">
          Order from your favourite campus outlets — prepared fresh and delivered by university carts.
        </p>
        <div className="mt-3 md:mt-5">
          <Link
            href="/food"
            className={cn(
              buttonVariants({ size: 'md' }),
              'bg-white text-brand-700 shadow-md hover:bg-brand-50 md:h-12 md:px-6 md:text-base',
            )}
          >
            Order now <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
