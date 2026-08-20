import { Prisma } from '@prisma/client';

/** Prisma Decimal → number (safe for currency at our scale). */
export function dec(value: Prisma.Decimal | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return typeof value === 'number' ? value : value.toNumber();
}
