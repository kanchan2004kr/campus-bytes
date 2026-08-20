/**
 * Development seed. Idempotent-ish: clears campus data then re-creates it.
 * DEV/SEED ACCOUNTS ONLY — credentials below are for local development.
 *
 *   Admin       admin@nims.dev        / Admin@12345
 *   Restaurant  owner@vistacolline.dev / Owner@12345  (Vista Colline)
 *   Student     student@nims.dev      (email OTP — code printed to API console)
 */
import 'dotenv/config'; // load apps/api/.env so DATABASE_URL is available
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const SUBDOMAIN = process.env.DEFAULT_TENANT_SUBDOMAIN ?? 'nims';

const img = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=70`;

async function main(): Promise<void> {
  // Fresh campus
  await prisma.campus.deleteMany({ where: { subdomain: SUBDOMAIN } });
  const campus = await prisma.campus.create({
    data: {
      name: 'NIMS University',
      subdomain: SUBDOMAIN,
      settings: { commissionPct: 12, deliveryFee: 20, convenienceFee: 0, currency: 'INR' },
    },
  });
  const campusId = campus.id;

  // Zones + hostels + rooms
  const north = await prisma.campusZone.create({ data: { campusId, name: 'North Campus' } });
  const south = await prisma.campusZone.create({ data: { campusId, name: 'South Campus' } });
  await prisma.campusZone.create({ data: { campusId, name: 'Library Block (Pickup)', isPickupPoint: true } });

  const hostelDefs = [
    { name: 'Larimar Hostel', zoneId: north.id },
    { name: 'Vista Hostel', zoneId: north.id },
    { name: 'LG Hostel', zoneId: south.id },
    { name: 'LP Hostel', zoneId: south.id },
  ];
  const hostels = [];
  for (const h of hostelDefs) {
    const hostel = await prisma.hostel.create({ data: { campusId, name: h.name, zoneId: h.zoneId } });
    // seed a handful of rooms
    for (const roomNo of ['101', '204', '512', '733', '811']) {
      await prisma.room.create({ data: { hostelId: hostel.id, roomNo } });
    }
    hostels.push(hostel);
  }

  // Carts
  for (const [i, status] of ['available', 'busy', 'available', 'offline'].entries()) {
    await prisma.foodCart.create({
      data: { campusId, label: `Campus Cart #0${i + 1}`, status: status as never },
    });
  }

  // ── Users ──
  const adminHash = await bcrypt.hash('Admin@12345', 10);
  await prisma.user.create({
    data: { campusId, role: 'admin', name: 'Rohan Kapadia', email: 'admin@nims.dev', passwordHash: adminHash, verified: true },
  });

  const larimar = hostels[0]!;
  const larimarRoom = await prisma.room.findFirst({ where: { hostelId: larimar.id, roomNo: '811' } });
  await prisma.user.create({
    data: {
      campusId, role: 'student', name: 'Kabir Singh', email: 'student@nims.dev',
      studentId: 'NIMS2023CS001', course: 'B.Tech Computer Science',
      verified: true, hostelId: larimar.id, roomId: larimarRoom?.id ?? null,
    },
  });

  // ── Restaurants (owner user + menu) ──
  const ownerHash = await bcrypt.hash('Owner@12345', 10);

  const restaurantDefs = [
    {
      name: 'Vista Colline', cuisine: 'Chai · Snacks · Combos', status: 'approved',
      cover: img('photo-1567620905732-2d1ec7ab7445'), rating: 4.5, ratingCount: 812, prep: 12,
      ownerEmail: 'owner@vistacolline.dev', ownerName: 'Meera Joshi',
    },
    {
      name: 'Le Gabriel', cuisine: 'Biryani · Beverages', status: 'approved',
      cover: img('photo-1563379091339-03b21ab4a4f8'), rating: 3.4, ratingCount: 305, prep: 18,
    },
    {
      name: '365', cuisine: 'Maggie · Paneer · Rolls', status: 'approved',
      cover: img('photo-1585032226651-759b368d7246'), rating: 4.5, ratingCount: 1290, prep: 9,
    },
    {
      name: 'La Popote', cuisine: 'Aloo Paratha · Chole · Thali', status: 'approved',
      cover: img('photo-1601050690597-df0568f70950'), rating: 2.2, ratingCount: 88, prep: 22, paused: true,
    },
    {
      name: 'Brew Point', cuisine: 'Coffee · Sandwiches', status: 'pending',
      cover: img('photo-1554118811-1e0d58224f24'), rating: 0, ratingCount: 0, prep: 14,
    },
  ];

  for (const def of restaurantDefs) {
    let ownerUserId: string | undefined;
    if (def.ownerEmail) {
      const owner = await prisma.user.create({
        data: { campusId, role: 'restaurant', name: def.ownerName!, email: def.ownerEmail, passwordHash: ownerHash, verified: true },
      });
      ownerUserId = owner.id;
    }
    const restaurant = await prisma.restaurant.create({
      data: {
        campusId, name: def.name, cuisine: def.cuisine, coverUrl: def.cover,
        status: def.status as never, isPaused: def.paused ?? false,
        prepTimeMin: def.prep, avgRating: def.rating, ratingCount: def.ratingCount,
        ...(ownerUserId ? { ownerUserId } : {}),
      },
    });

    // Menu only for the flagship (Vista Colline) to keep seed focused.
    if (def.name === 'Vista Colline') {
      const hot = await prisma.menuCategory.create({ data: { restaurantId: restaurant.id, name: 'Hot & Fresh', sortOrder: 1 } });
      const bev = await prisma.menuCategory.create({ data: { restaurantId: restaurant.id, name: 'Beverages', sortOrder: 2 } });
      const combo = await prisma.menuCategory.create({ data: { restaurantId: restaurant.id, name: 'Combos', sortOrder: 3 } });
      const items = [
        { cat: hot.id, name: 'Masala Maggie', price: 60, veg: true, img: img('photo-1612929633738-8fe44f7ec841'), desc: 'Classic noodles with veggies and house masala.' },
        { cat: hot.id, name: 'Aloo Paratha (2 pcs)', price: 80, veg: true, img: img('photo-1601050690597-df0568f70950'), desc: 'Stuffed potato parathas with butter, curd and pickle.' },
        { cat: hot.id, name: 'Paneer Tikka Roll', price: 110, veg: true, img: img('photo-1565299624946-b28f40a0ae38'), desc: 'Smoky paneer tikka in a soft roomali with mint chutney.' },
        { cat: bev.id, name: 'Masala Chai', price: 20, veg: true, img: img('photo-1571934811356-5cc061b6821f'), desc: 'Slow-brewed cutting chai with ginger and cardamom.' },
        { cat: bev.id, name: 'Cold Coffee', price: 90, veg: true, img: img('photo-1461023058943-07fcbe16d735'), desc: 'Thick blended cold coffee topped with chocolate.', avail: false },
        { cat: combo.id, name: 'Chole Bhature Combo', price: 140, veg: true, img: img('photo-1626132647523-66f5bf380027'), desc: 'Two bhature with spiced chole, onions and a drink.' },
      ];
      for (const it of items) {
        await prisma.foodItem.create({
          data: {
            restaurantId: restaurant.id, categoryId: it.cat, name: it.name, price: it.price,
            isVeg: it.veg, imageUrl: it.img, description: it.desc, isAvailable: it.avail ?? true,
          },
        });
      }
    }
  }

  // Support tickets
  await prisma.supportTicket.createMany({
    data: [
      { campusId, code: 'TK-204', fromName: 'Priya Nair', role: 'student', subject: 'Order delivered cold', status: 'open' },
      { campusId, code: 'TK-203', fromName: 'Vista Colline', role: 'restaurant', subject: 'Cart not assigned at peak', status: 'open' },
      { campusId, code: 'TK-201', fromName: 'Kabir Singh', role: 'student', subject: 'Refund not received', status: 'resolved' },
    ],
  });

  // eslint-disable-next-line no-console
  console.log('✅ Seed complete for campus:', campus.name);
  console.log('   Admin:      admin@nims.dev / Admin@12345');
  console.log('   Restaurant: owner@vistacolline.dev / Owner@12345');
  console.log('   Student:    student@nims.dev (email OTP — code printed to API console)');
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
