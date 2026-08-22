import type { Metadata } from 'next';
import { RestaurantChrome } from '@/components/restaurant/chrome';

export const metadata: Metadata = {
  title: { default: 'Restaurant', template: '%s · CampusBytes Restaurant' },
};

export default function RestaurantLayout({ children }: { children: React.ReactNode }) {
  return <RestaurantChrome>{children}</RestaurantChrome>;
}
