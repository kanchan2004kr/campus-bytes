import type { FoodItem, MenuCategory } from '@campus-bytes/types';
import { API_ENABLED } from '@/lib/api-config';
import { api } from '@/lib/api-client';

/**
 * Restaurant menu store — in-memory, mutable, API-shaped (PRD §14.5 menu APIs).
 * CRUD + availability persist for the session so the Menu screen is fully live.
 */

const LATENCY = 220;
const delay = <T>(v: T, ms = LATENCY): Promise<T> => new Promise((r) => setTimeout(() => r(v), ms));
const RID = 'r-vista';
const img = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=70`;

interface MenuStore {
  categories: MenuCategory[];
  items: FoodItem[];
}

function seed(): MenuStore {
  return {
    categories: [
      { id: 'c-hot', restaurantId: RID, name: 'Hot & Fresh', sortOrder: 1 },
      { id: 'c-bev', restaurantId: RID, name: 'Beverages', sortOrder: 2 },
      { id: 'c-combo', restaurantId: RID, name: 'Combos', sortOrder: 3 },
    ],
    items: [
      { id: 'f-maggie', restaurantId: RID, categoryId: 'c-hot', name: 'Masala Maggie', description: 'Classic two-minute noodles tossed with veggies and house masala.', price: 60, isVeg: true, imageUrl: img('photo-1612929633738-8fe44f7ec841'), isAvailable: true },
      { id: 'f-aloo', restaurantId: RID, categoryId: 'c-hot', name: 'Aloo Paratha (2 pcs)', description: 'Stuffed potato parathas with butter, curd and pickle.', price: 80, isVeg: true, imageUrl: img('photo-1601050690597-df0568f70950'), isAvailable: true },
      { id: 'f-roll', restaurantId: RID, categoryId: 'c-hot', name: 'Paneer Tikka Roll', description: 'Smoky paneer tikka wrapped in a soft roomali with mint chutney.', price: 110, isVeg: true, imageUrl: img('photo-1565299624946-b28f40a0ae38'), isAvailable: true },
      { id: 'f-chai', restaurantId: RID, categoryId: 'c-bev', name: 'Masala Chai', description: 'Slow-brewed cutting chai with ginger and cardamom.', price: 20, isVeg: true, imageUrl: img('photo-1571934811356-5cc061b6821f'), isAvailable: true },
      { id: 'f-coffee', restaurantId: RID, categoryId: 'c-bev', name: 'Cold Coffee', description: 'Thick blended cold coffee topped with chocolate.', price: 90, isVeg: true, imageUrl: img('photo-1461023058943-07fcbe16d735'), isAvailable: false },
      { id: 'f-combo', restaurantId: RID, categoryId: 'c-combo', name: 'Chole Bhature Combo', description: 'Two fluffy bhature with spiced chole, onions and a drink.', price: 140, isVeg: true, imageUrl: img('photo-1626132647523-66f5bf380027'), isAvailable: true },
    ],
  };
}

const g = globalThis as unknown as { __cbMenuStore?: MenuStore };
const menuStore: MenuStore = g.__cbMenuStore ?? (g.__cbMenuStore = seed());

export async function getMenu() {
  if (API_ENABLED) return api.get<{ categories: MenuCategory[]; items: FoodItem[] }>('/restaurant/menu');
  return delay({
    categories: [...menuStore.categories].sort((a, b) => a.sortOrder - b.sortOrder),
    items: [...menuStore.items],
  });
}

export interface MenuItemInput {
  id?: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  isVeg: boolean;
  imageUrl: string | null;
}

export async function saveItem(input: MenuItemInput): Promise<FoodItem> {
  if (API_ENABLED) {
    const body = {
      categoryId: input.categoryId,
      name: input.name,
      description: input.description,
      price: input.price,
      isVeg: input.isVeg,
      imageUrl: input.imageUrl,
    };
    return input.id
      ? api.put<FoodItem>(`/restaurant/menu/items/${input.id}`, body)
      : api.post<FoodItem>('/restaurant/menu/items', body);
  }
  if (input.id) {
    const idx = menuStore.items.findIndex((i) => i.id === input.id);
    if (idx < 0) throw new Error('Item not found');
    menuStore.items[idx] = { ...menuStore.items[idx], ...input, id: input.id } as FoodItem;
    return delay(menuStore.items[idx]!);
  }
  const created: FoodItem = {
    id: crypto.randomUUID(),
    restaurantId: RID,
    categoryId: input.categoryId,
    name: input.name,
    description: input.description,
    price: input.price,
    isVeg: input.isVeg,
    imageUrl: input.imageUrl,
    isAvailable: true,
  };
  menuStore.items.push(created);
  return delay(created);
}

export async function deleteItem(id: string) {
  if (API_ENABLED) return api.del(`/restaurant/menu/items/${id}`);
  menuStore.items = menuStore.items.filter((i) => i.id !== id);
  return delay({ ok: true });
}

export async function toggleAvailability(id: string, isAvailable: boolean) {
  if (API_ENABLED) return api.patch(`/restaurant/menu/items/${id}/availability`, { isAvailable });
  const it = menuStore.items.find((i) => i.id === id);
  if (!it) throw new Error('Item not found');
  it.isAvailable = isAvailable;
  return delay(it);
}

export async function addCategory(name: string): Promise<MenuCategory> {
  if (API_ENABLED) return api.post<MenuCategory>('/restaurant/menu/categories', { name });
  const cat: MenuCategory = {
    id: crypto.randomUUID(),
    restaurantId: RID,
    name,
    sortOrder: menuStore.categories.length + 1,
  };
  menuStore.categories.push(cat);
  return delay(cat);
}

export async function deleteCategory(id: string) {
  if (API_ENABLED) return api.del(`/restaurant/menu/categories/${id}`);
  menuStore.categories = menuStore.categories.filter((c) => c.id !== id);
  menuStore.items = menuStore.items.filter((i) => i.categoryId !== id);
  return delay({ ok: true });
}
