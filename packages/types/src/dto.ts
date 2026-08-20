import { z } from 'zod';

/** Request/response contracts shared by web + api. Validated on both sides. */

export const otpRequestSchema = z.object({
  identifier: z.string().min(3), // email (MVP) or phone
});
export type OtpRequestDto = z.infer<typeof otpRequestSchema>;

export const otpVerifySchema = z.object({
  identifier: z.string().min(3),
  code: z.string().regex(/^\d{6}$/, 'OTP must be 6 digits'),
});
export type OtpVerifyDto = z.infer<typeof otpVerifySchema>;

export const passwordLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
export type PasswordLoginDto = z.infer<typeof passwordLoginSchema>;

export const createOrderItemSchema = z.object({
  foodItemId: z.string().uuid(),
  quantity: z.number().int().min(1).max(50),
});

export const createOrderSchema = z.object({
  restaurantId: z.string().uuid(),
  items: z.array(createOrderItemSchema).min(1),
  deliveryZoneId: z.string().uuid().nullable().optional(),
  deliveryHostelId: z.string().uuid().nullable().optional(),
  deliveryRoomId: z.string().uuid().nullable().optional(),
  notes: z.string().max(280).optional(),
});
export type CreateOrderDto = z.infer<typeof createOrderSchema>;

export const acceptOrderSchema = z.object({
  prepTimeMin: z.number().int().min(1).max(120),
});
export type AcceptOrderDto = z.infer<typeof acceptOrderSchema>;

export const rejectOrderSchema = z.object({
  reason: z.string().min(3).max(200),
});
export type RejectOrderDto = z.infer<typeof rejectOrderSchema>;

export const rateOrderSchema = z.object({
  orderId: z.string().uuid(),
  score: z.number().int().min(1).max(5),
  review: z.string().max(500).optional(),
});
export type RateOrderDto = z.infer<typeof rateOrderSchema>;

export const menuItemSchema = z.object({
  categoryId: z.string().uuid(),
  name: z.string().min(1).max(80),
  description: z.string().max(280).optional(),
  price: z.number().positive(),
  isVeg: z.boolean(),
  imageUrl: z.string().url().nullable().optional(),
});
export type MenuItemDto = z.infer<typeof menuItemSchema>;

/** Standard API response envelope (PRD §14). */
export interface ApiError {
  error: { code: string; message: string; details?: unknown[] };
}
export interface Paginated<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
}
