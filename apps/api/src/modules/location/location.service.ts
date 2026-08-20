import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantService } from '../tenant/tenant.service';

@Injectable()
export class LocationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantService,
  ) {}

  async hostels() {
    const campusId = await this.tenant.getDefaultCampusId();
    const hostels = await this.prisma.hostel.findMany({
      where: { campusId },
      include: { zone: true, _count: { select: { rooms: true } } },
      orderBy: { name: 'asc' },
    });
    return hostels.map((h) => ({
      id: h.id,
      name: h.name,
      zoneId: h.zoneId,
      zoneName: h.zone?.name ?? '—',
      rooms: h._count.rooms,
    }));
  }

  async rooms(hostelId: string) {
    const rooms = await this.prisma.room.findMany({ where: { hostelId }, orderBy: { roomNo: 'asc' } });
    return rooms.map((r) => ({ id: r.id, hostelId: r.hostelId, roomNo: r.roomNo }));
  }

  async zones() {
    const campusId = await this.tenant.getDefaultCampusId();
    const zones = await this.prisma.campusZone.findMany({ where: { campusId }, orderBy: { name: 'asc' } });
    return zones.map((z) => ({ id: z.id, name: z.name, isPickupPoint: z.isPickupPoint }));
  }
}
