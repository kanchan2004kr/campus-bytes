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
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-600 to-brand-700 px-5 py-7 text-white md:rounded-xl md:px-8 md:py-10 lg:min-h-[480px]">
      {/* Soft decorative shapes — subtle, not neon */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-16 right-16 h-44 w-44 rounded-full bg-brand-400/30 blur-2xl" />

      {/* Right-side 3D artwork. Filled edge-to-edge via bg-cover (no empty box), with a
          soft LEFT fade so the hero's own orange gradient shows through — the artwork
          melts into the single continuous background instead of looking like a pasted
          rectangle. Shown on large screens (where there's room beside the text). */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-[58%] bg-cover lg:block xl:w-[62%]"
        style={{
          backgroundImage: 'url(/hero-student.jpg)',
          backgroundPosition: 'right top',
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, #000 20%)',
          maskImage: 'linear-gradient(to right, transparent 0%, #000 20%)',
        }}
      />

      {/* Left orange wash — keeps the text on clean, readable orange and smooths the
          transition into the artwork so there is no visible seam. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 hidden w-[64%] lg:block"
        style={{
          background:
            'linear-gradient(to right, rgb(240 86 45) 4%, rgba(240,86,45,0.7) 32%, rgba(240,86,45,0) 74%)',
        }}
      />

      {/* Text — unchanged content, alignment, fonts and button */}
      <div className="relative z-10 max-w-md">
        <p className="text-sm font-medium text-brand-100">Hey {firstName}</p>
        <h1 className="mt-2 font-display text-3xl font-bold leading-[1.1] md:text-4xl">
          Skip the queue.
          <br />
          Eat from your room.
        </h1>
        <p className="mt-3 max-w-sm text-sm text-brand-50/90">
          Order from your favourite campus outlets — prepared fresh and delivered by university carts.
        </p>
        <div className="mt-5">
          <Link
            href="/food"
            className={cn(buttonVariants({ size: 'lg' }), 'bg-white text-brand-700 hover:bg-brand-50')}
          >
            Order now <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
