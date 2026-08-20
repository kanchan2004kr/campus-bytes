import Link from 'next/link';

export function SectionHeader({ title, seeAllHref }: { title: string; seeAllHref?: string }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="font-display text-xl font-semibold text-ink-900">{title}</h2>
      {seeAllHref && (
        <Link
          href={seeAllHref}
          className="-my-1 rounded-md px-2 py-1 text-sm font-medium text-brand-600 hover:bg-brand-50 hover:text-brand-700"
        >
          See all
        </Link>
      )}
    </div>
  );
}
