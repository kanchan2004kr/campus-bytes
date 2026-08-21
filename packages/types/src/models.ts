import type {
  CartStatus,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  RestaurantStatus,
  UserRole,
  UserStatus,
} from './enums';

export type UUID = string;
export type ISODateString = string;

export interface Tenant {
  id: UUID;
  name: string;
  subdomain: string;
  settings: TenantSettings;
  status: 'active' | 'suspended';
}

export interface TenantSettings {
  commissionPct: number;
  deliveryFee: number;
  convenienceFee: number;
  currency: string; // 'INR'
  campusHours: { open: string; close: string };
}

export interface StudentProfile {
  id: UUID;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  hostelId: UUID | null;
  roomId: UUID | null;
  createdAt: ISODateString;
}

export interface Restaurant {
  id: UUID;
  name: string;
  description: string | null;
  cuisine: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  status: RestaurantStatus;
  isOpen: boolean;
  isPaused: boolean;
  avgRating: number;
  ratingCount: number;
  prepTimeMin: number;
  deliveryAvailable: boolean;
  crowdLevel: 'low' | 'medium' | 'high';
}

export interface MenuCategory {
  id: UUID;
  restaurantId: UUID;
  name: string;
  sortOrder: number;
}

export interface FoodItem {
  id: UUID;
  restaurantId: UUID;
  categoryId: UUID;
  name: string;
  description: string | null;
  price: number;
  isVeg: boolean;
  imageUrl: string | null;
  isAvailable: boolean;
}

export interface Hostel {
  id: UUID;
  name: string;
  zoneId: UUID | null;
}

export interface Room {
  id: UUID;
  hostelId: UUID;
  roomNo: string;
}

export interface CampusZone {
  id: UUID;
  name: string;
  isPickupPoint: boolean;
}

export interface FoodCart {
  id: UUID;
  label: string; // "Campus Cart #03"
  status: CartStatus;
  currentZoneId: UUID | null;
}

export interface OrderItem {
  id: UUID;
  foodItemId: UUID;
  nameSnapshot: string;
  priceSnapshot: number;
  quantity: number;
}

export interface Order {
  id: UUID;
  code: string; // "CB1042"
  studentId: UUID;
  restaurantId: UUID;
  restaurantName: string;
  cartId: UUID | null;
  cartLabel: string | null;
  deliveryZoneId: UUID | null;
  deliveryHostelName: string | null;
  deliveryRoomNo: string | null;
  // Approved campus delivery location snapshot (frozen at order time).
  deliveryType: string | null; // 'hostel' | 'gate' | 'university'
  deliveryLocationName: string | null;
  deliveryInstructions: string | null;
  // Student identity for restaurant/admin order views.
  studentName: string | null;
  studentId2: string | null; // university student ID (distinct from the user UUID)
  status: OrderStatus;
  prepTimeMin: number | null;
  itemTotal: number;
  fees: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  notes: string | null;
  rejectionReason: string | null;
  items: OrderItem[];
  placedAt: ISODateString;
  updatedAt: ISODateString;
}

export interface OrderStatusEvent {
  status: OrderStatus;
  changedAt: ISODateString;
  changedByRole: UserRole | 'system';
}

export interface Rating {
  id: UUID;
  orderId: UUID;
  restaurantId: UUID;
  score: number; // 1-5
  review: string | null;
  createdAt: ISODateString;
}

/** Item held in the client-side cart before checkout. */
export interface CartLine {
  foodItemId: UUID;
  name: string;
  price: number;
  isVeg: boolean;
  imageUrl: string | null;
  quantity: number;
}
