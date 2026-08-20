import {
  LayoutDashboard,
  ListChecks,
  UtensilsCrossed,
  ToggleRight,
  BarChart3,
  History,
  Settings,
} from 'lucide-react';
import type { NavItem } from '@/components/dashboard/sidebar';

export const RESTAURANT_NAV: NavItem[] = [
  { href: '/r', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/r/orders', label: 'Live Orders', icon: ListChecks },
  { href: '/r/menu', label: 'Menu', icon: UtensilsCrossed },
  { href: '/r/availability', label: 'Availability', icon: ToggleRight },
  { href: '/r/sales', label: 'Sales', icon: BarChart3 },
  { href: '/r/history', label: 'Order History', icon: History },
  { href: '/r/settings', label: 'Settings', icon: Settings },
];
