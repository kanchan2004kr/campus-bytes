import type { Order, OrderItem } from '@campus-bytes/types';
import { dec } from '../../common/serialize';

// Loose row types (Prisma include results) → frontend Order shape.
export function toOrder(o: any): Order {
  return {
    id: o.id,
    code: o.code,
    studentId: o.studentId,
    restaurantId: o.restaurantId,
    restaurantName: o.restaurant?.name ?? '',
    cartId: o.cartId ?? null,
    cartLabel: o.cart?.label ?? null,
    deliveryZoneId: o.deliveryZoneId ?? null,
    deliveryHostelName: o.deliveryHostelName ?? null,
    deliveryRoomNo: o.deliveryRoomNo ?? null,
    deliveryType: o.deliveryType ?? null,
    deliveryLocationName: o.deliveryLocationName ?? null,
    deliveryInstructions: o.deliveryInstructions ?? null,
    studentName: o.student?.name ?? null,
    studentId2: o.student?.studentId ?? null,
    status: o.status,
    prepTimeMin: o.prepTimeMin ?? null,
    itemTotal: dec(o.itemTotal),
    fees: dec(o.fees),
    grandTotal: dec(o.grandTotal),
    paymentMethod: o.paymentMethod,
    paymentStatus: o.payment?.status ?? 'pending',
    notes: o.notes ?? null,
    rejectionReason: o.rejectionReason ?? null,
    items: (o.items ?? []).map(toOrderItem),
    placedAt: o.placedAt instanceof Date ? o.placedAt.toISOString() : o.placedAt,
    updatedAt: o.updatedAt instanceof Date ? o.updatedAt.toISOString() : o.updatedAt,
  };
}

/**
 * Restaurant-facing order shape: fully populated so staff see WHAT to make and
 * WHERE to deliver without opening another page. Item names/prices/veg come from
 * the frozen OrderItem snapshot; delivery + student from the order relations.
 */
export function toRestaurantOrder(o: any) {
  return {
    id: o.id,
    code: o.code,
    studentName: o.student?.name ?? 'Student',
    studentId2: o.student?.studentId ?? null,
    hostelName: o.deliveryHostelName ?? o.deliveryLocationName ?? '',
    roomNo: o.deliveryRoomNo ?? '',
    deliveryType: o.deliveryType ?? null,
    deliveryLocationName: o.deliveryLocationName ?? o.deliveryHostelName ?? null,
    deliveryRoomNo: o.deliveryRoomNo ?? null,
    deliveryInstructions: o.deliveryInstructions ?? null,
    items: (o.items ?? []).map((i: any) => ({
      name: i.nameSnapshot,
      quantity: i.quantity,
      price: dec(i.priceSnapshot),
      isVeg: i.isVegSnapshot,
    })),
    itemTotal: dec(o.itemTotal),
    fees: dec(o.fees),
    grandTotal: dec(o.grandTotal),
    notes: o.notes ?? null,
    status: o.status,
    prepTimeMin: o.prepTimeMin ?? null,
    rejectionReason: o.rejectionReason ?? null,
    cartId: o.cartId ?? null,
    cartLabel: o.cart?.label ?? null,
    placedAt: o.placedAt instanceof Date ? o.placedAt.toISOString() : o.placedAt,
    acceptedAt: null as string | null,
  };
}

export function toOrderItem(i: any): OrderItem {
  return {
    id: i.id,
    foodItemId: i.foodItemId ?? '',
    nameSnapshot: i.nameSnapshot,
    priceSnapshot: dec(i.priceSnapshot),
    quantity: i.quantity,
  };
}

export const ORDER_INCLUDE = {
  restaurant: { select: { name: true } },
  student: { select: { name: true, studentId: true } },
  cart: { select: { label: true } },
  items: true,
  payment: { select: { status: true } },
} as const;
