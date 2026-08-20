export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-900">{title}</h1>
        {description && <p className="mt-0.5 text-sm text-ink-600">{description}</p>}
      </div>
      {action}
    </div>
  );
}
