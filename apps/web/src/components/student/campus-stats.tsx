import { Clock, Store, Truck } from 'lucide-react';

/**
 * Campus info strip — answers "how fast can I get food?".
 * Note: this replaces the reference's rider-oriented "Riders nearby" stat with
 * a cart-delivery ETA, per Campus Bytes' university-cart model.
 */
export function CampusStats({
  avgWaitMin,
  outletsOpen,
  outletsTotal,
  deliveryEtaMin,
}: {
  avgWaitMin: number;
  outletsOpen: number;
  outletsTotal: number;
  deliveryEtaMin: number;
}) {
  const stats = [
    { icon: Clock, value: `${avgWaitMin} min`, label: 'Avg wait' },
    { icon: Store, value: `${outletsOpen}/${outletsTotal}`, label: 'Outlets open' },
    { icon: Truck, value: `~${deliveryEtaMin} min`, label: 'Delivery ETA' },
  ];
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {stats.map((s) => (
        <div
          key={s.label}
          className="flex flex-col items-center gap-1 rounded-md border border-line bg-surface px-2 py-3 text-center"
        >
          <s.icon className="h-4.5 w-4.5 text-brand-600" />
          <span className="font-display text-base font-bold text-ink-900">{s.value}</span>
          <span className="text-2xs text-ink-400">{s.label}</span>
        </div>
      ))}
    </div>
  );
}
