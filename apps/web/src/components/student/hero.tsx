'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { buttonVariants, cn } from '@campus-bytes/ui';
import { getStudentProfile } from '@/data/client';

// The baked-in orange of /hero-student.jpg — the banner background is set to the
// same colour so the contained artwork melts into one continuous scene (no seam).
const ART_ORANGE = '#e9551c';

// A few floating particles for the "elements everywhere" look (pure CSS, no asset).
const PARTICLES = [
  { c: 'rgba(255,255,255,0.5)', s: 6, top: '18%', left: '10%' },
  { c: 'rgba(255,196,120,0.7)', s: 10, top: '62%', left: '6%' },
  { c: 'rgba(255,120,60,0.7)', s: 8, top: '38%', left: '30%' },
  { c: 'rgba(255,255,255,0.4)', s: 5, top: '78%', left: '22%' },
  { c: 'rgba(255,210,140,0.6)', s: 7, top: '26%', left: '46%' },
  { c: 'rgba(255,120,60,0.6)', s: 9, top: '70%', left: '40%' },
];

export function Hero() {
  const { data } = useQuery({ queryKey: ['student-profile'], queryFn: getStudentProfile });
  const displayName = data?.name?.trim() || 'there';

  return (
    <section
      className="relative w-full overflow-hidden rounded-2xl text-white h-[300px] sm:h-[340px] md:h-[400px] lg:h-[460px]"
      style={{ backgroundColor: ART_ORANGE }}
    >
      {/* Rich orange gradient + warm glow so the whole banner reads as one scene. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 90% at 78% 40%, rgba(255,150,70,0.55) 0%, rgba(233,85,28,0) 55%), linear-gradient(120deg, #d9401a 0%, #e9551c 45%, #f0562d 100%)',
        }}
      />

      {/* Floating particles across the banner (incl. the left/text side). */}
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          aria-hidden
          className="pointer-events-none absolute rounded-full blur-[1px]"
          style={{ width: p.s, height: p.s, top: p.top, left: p.left, backgroundColor: p.c }}
        />
      ))}

      {/* FULL artwork — `contain` guarantees the whole image (boy head→backpack +
          burger, drink, chicken bowl, taco, onion rings) is always visible and never
          cropped. Its left edge is masked so it dissolves into the orange with no seam
          or rectangle; matching background colour completes the blend. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-[56%] bg-contain bg-right bg-no-repeat sm:w-[56%] md:w-[58%] lg:w-[56%]"
        style={{
          backgroundImage: 'url(/hero-student.jpg)',
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, #000 16%)',
          maskImage: 'linear-gradient(to right, transparent 0%, #000 16%)',
        }}
      />

      {/* Left scrim keeps the text crisp over the blended scene. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `linear-gradient(to right, ${ART_ORANGE} 0%, rgba(233,85,28,0.9) 26%, rgba(233,85,28,0.25) 50%, rgba(233,85,28,0) 64%)`,
        }}
      />

      {/* Subtle bottom wave for the premium finish. */}
      <svg
        aria-hidden
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-8 w-full sm:h-10 md:h-12"
      >
        <path d="M0,72 C240,116 480,116 720,84 C960,52 1200,52 1440,84 L1440,120 L0,120 Z" fill="rgba(255,255,255,0.10)" />
        <path d="M0,92 C240,120 480,120 720,100 C960,80 1200,80 1440,100 L1440,120 L0,120 Z" fill="rgba(255,255,255,0.08)" />
      </svg>

      {/* Text + CTA — left aligned, responsive, never overlapping the character. */}
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
