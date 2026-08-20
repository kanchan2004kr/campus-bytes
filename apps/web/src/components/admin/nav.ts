import {
  LayoutDashboard,
  ClipboardCheck,
  Store,
  Users,
  Truck,
  Building2,
  Radio,
  BarChart3,
  CreditCard,
  Megaphone,
  LifeBuoy,
  Settings,
  ScrollText,
} from 'lucide-react';
import type { NavItem } from '@/components/dashboard/sidebar';

export const ADMIN_NAV: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/approvals', label: 'Restaurant Approvals', icon: ClipboardCheck },
  { href: '/admin/restaurants', label: 'Restaurants', icon: Store },
  { href: '/admin/students', label: 'Students', icon: Users },
  { href: '/admin/carts', label: 'Campus Carts', icon: Truck },
  { href: '/admin/zones', label: 'Hostels & Zones', icon: Building2 },
  { href: '/admin/orders', label: 'Live Orders', icon: Radio },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/payments', label: 'Payments', icon: CreditCard },
  { href: '/admin/notifications', label: 'Notifications', icon: Megaphone },
  { href: '/admin/support', label: 'Support', icon: LifeBuoy },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
  { href: '/admin/audit', label: 'Audit Logs', icon: ScrollText },
];
