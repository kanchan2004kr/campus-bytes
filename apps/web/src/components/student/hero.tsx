'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { buttonVariants, cn } from '@campus-bytes/ui';
import { getStudentProfile } from '@/data/client';

export function Hero() {
  const { data } = useQuery({ queryKey: ['student-profile'], queryFn: getStudentProfile });
  const firstName = (data?.name ?? 'there').split(' ')[0];

  return (
    <section className="relative flex flex-col justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-brand-700 px-5 py-6 text-white h-[230px] sm:h-[250px] md:h-auto md:min-h-0 md:rounded-xl md:px-8 md:py-10 lg:min-h-[480px]">
      {/* Soft decorative shapes — subtle, not neon */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-16 right-16 h-44 w-44 rounded-full bg-brand-400/30 blur-2xl" />

      {/* Right-side 3D artwork. Filled edge-to-edge via bg-cover (no empty box), with a
          soft LEFT fade so the hero's own orange gradient shows through — the artwork
          melts into the single continuous background instead of looking like a pasted
          rectangle. Visible on ALL breakpoints: on phones it sits on the right ~44%
          (character bottom-anchored) so it never covers the left-aligned text/CTA, and
          it widens on larger screens. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 block w-[44%] bg-cover bg-no-repeat sm:w-[46%] lg:w-[58%] xl:w-[62%]"
        style={{
          backgroundImage: 'url(/hero-student.jpg)',
          backgroundPosition: 'right bottom',
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, #000 30%)',
          maskImage: 'linear-gradient(to right, transparent 0%, #000 30%)',
        }}
      />

      {/* Left orange wash — keeps the text on clean, readable orange and smooths the
          transition into the artwork so there is no visible seam. On phones the wash is
          slightly wider to guarantee text contrast beside the character. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 block w-[72%] sm:w-[70%] lg:w-[64%]"
        style={{
          background:
            'linear-gradient(to right, rgb(240 86 45) 4%, rgba(240,86,45,0.7) 42%, rgba(240,86,45,0) 82%)',
        }}
      />

      {/* Text — unchanged content, alignment, fonts and button. Constrained on phones so
          it never runs under the character illustration. */}
      <div className="relative z-10 max-w-[62%] sm:max-w-[62%] lg:max-w-md">
        <p className="text-xs font-medium text-brand-100 sm:text-sm">Hey {firstName}</p>
        <h1 className="mt-1.5 font-display text-xl font-bold leading-[1.12] sm:text-2xl md:mt-2 md:text-4xl">
          Skip the queue.
          <br />
          Eat from your room.
        </h1>
        <p className="mt-2 line-clamp-2 max-w-sm text-xs text-brand-50/90 sm:text-sm md:mt-3 md:line-clamp-none">
          Order from your favourite campus outlets — prepared fresh and delivered by university carts.
        </p>
        <div className="mt-3 md:mt-5">
          <Link
            href="/food"
            className={cn(
              buttonVariants({ size: 'md' }),
              'bg-white text-brand-700 hover:bg-brand-50 md:h-12 md:px-6 md:text-base',
            )}
          >
            Order now <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
