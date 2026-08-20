import type { FoodItem, MenuCategory, Restaurant } from '@campus-bytes/types';
import { dec } from '../../common/serialize';

type RestaurantRow = {
  id: string; name: string; description: string | null; cuisine: string | null;
  logoUrl: string | null; coverUrl: string | null; status: string; isPaused: boolean;
  avgRating: number; ratingCount: number; prepTimeMin: number; deliveryAvailable: boolean;
  crowdLevel: string;
};

export function toRestaurant(r: RestaurantRow): Restaurant {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    cuisine: r.cuisine,
    logoUrl: r.logoUrl,
    coverUrl: r.coverUrl,
    status: r.status as Restaurant['status'],
    isOpen: r.status === 'approved' && !r.isPaused,
    isPaused: r.isPaused,
    avgRating: r.avgRating,
    ratingCount: r.ratingCount,
    prepTimeMin: r.prepTimeMin,
    deliveryAvailable: r.deliveryAvailable,
    crowdLevel: r.crowdLevel as Restaurant['crowdLevel'],
  };
}

export function toCategory(c: { id: string; restaurantId: string; name: string; sortOrder: number }): MenuCategory {
  return { id: c.id, restaurantId: c.restaurantId, name: c.name, sortOrder: c.sortOrder };
}

export function toFoodItem(f: {
  id: string; restaurantId: string; categoryId: string; name: string;
  description: string | null; price: unknown; isVeg: boolean; imageUrl: string | null; isAvailable: boolean;
}): FoodItem {
  return {
    id: f.id,
    restaurantId: f.restaurantId,
    categoryId: f.categoryId,
    name: f.name,
    description: f.description,
    price: dec(f.price as never),
    isVeg: f.isVeg,
    imageUrl: f.imageUrl,
    isAvailable: f.isAvailable,
  };
}
