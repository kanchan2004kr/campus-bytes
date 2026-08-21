'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { buttonVariants, cn } from '@campus-bytes/ui';
import { getStudentProfile } from '@/data/client';

// Matches the baked-in orange of /hero-student.jpg so the contained artwork
// blends seamlessly into the banner background (no visible rectangle/seam).
const ART_ORANGE = '#e9551c';

export function Hero() {
  const { data } = useQuery({ queryKey: ['student-profile'], queryFn: getStudentProfile });
  const displayName = data?.name?.trim() || 'there';

  return (
    <section
      className="relative overflow-hidden rounded-2xl text-white h-[280px] sm:h-[320px] md:h-[380px] lg:h-[460px]"
      style={{ backgroundColor: ART_ORANGE }}
    >
      {/* Subtle brand gradient over the base orange for depth. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: 'linear-gradient(135deg, rgba(240,86,45,0.55) 0%, rgba(217,64,20,0.35) 100%)' }}
      />

      {/* FULL artwork — `contain` guarantees the whole image (boy + all food) is
          always visible and never cropped. Anchored right so text sits on the
          left. Because the image's own background is the same orange, it melts
          into the banner. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-[52%] bg-contain bg-right bg-no-repeat sm:w-[54%] md:w-[56%] lg:w-[52%]"
        style={{ backgroundImage: 'url(/hero-student.jpg)' }}
      />

      {/* Left scrim — keeps text crisp and hides the artwork's left edge. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `linear-gradient(to right, ${ART_ORANGE} 0%, rgba(233,85,28,0.92) 30%, rgba(233,85,28,0.35) 52%, rgba(233,85,28,0) 66%)`,
        }}
      />

      {/* Bottom wave/curve for the premium look. */}
      <svg
        aria-hidden
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-8 w-full sm:h-10 md:h-12"
      >
        <path d="M0,64 C240,120 480,120 720,80 C960,40 1200,40 1440,80 L1440,120 L0,120 Z" fill="rgba(255,255,255,0.12)" />
        <path d="M0,88 C240,120 480,120 720,96 C960,72 1200,72 1440,96 L1440,120 L0,120 Z" fill="rgba(255,255,255,0.10)" />
      </svg>

      {/* Text + CTA — left/top aligned, responsive sizes. Constrained width so it
          never overlaps the character. */}
      <div className="relative z-10 flex h-full max-w-[50%] flex-col justify-center px-5 py-6 sm:max-w-[50%] md:max-w-[50%] md:px-8 md:py-10 lg:max-w-[46%]">
        <p className="text-xs font-medium text-white/90 sm:text-sm">Hey, {displayName}</p>
        <h1 className="mt-1.5 font-display text-xl font-bold leading-[1.12] drop-shadow-sm sm:text-2xl md:mt-2 md:text-3xl lg:text-[2.6rem] lg:leading-[1.08]">
          Skip the queue.
          <br />
          Eat from your room.
        </h1>
        <p className="mt-2 line-clamp-2 text-xs text-white/90 sm:text-sm md:mt-3 md:line-clamp-none lg:text-base">
          Order from your favourite campus outlets — prepared fresh and delivered by university carts.
        </p>
        <div className="mt-3 md:mt-5">
          <Link
            href="/food"
            className={cn(
              buttonVariants({ size: 'md' }),
              'bg-white text-brand-700 shadow-sm hover:bg-brand-50 md:h-12 md:px-6 md:text-base',
            )}
          >
            Order now <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
