import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { loadEnv } from '../../config/env';

/**
 * Resolves the active campus (tenant). MVP is single-campus; tenant is resolved
 * by subdomain (default from env). Multi-tenant isolation is enforced everywhere
 * by scoping queries to campusId.
 */
@Injectable()
export class TenantService {
  private readonly env = loadEnv();
  private cachedId: string | null = null;

  constructor(private readonly prisma: PrismaService) {}

  async getDefaultCampusId(): Promise<string> {
    if (this.cachedId) return this.cachedId;
    const campus = await this.prisma.campus.findUnique({
      where: { subdomain: this.env.defaultTenantSubdomain },
    });
    if (!campus) {
      throw new NotFoundException('Default campus not found. Run the seed script.');
    }
    this.cachedId = campus.id;
    return campus.id;
  }
}
