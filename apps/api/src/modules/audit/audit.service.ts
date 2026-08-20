import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/** Writes immutable audit entries for privileged actions (PRD §19). */
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: {
    campusId: string;
    actorUserId?: string | null;
    actorLabel: string;
    action: string;
    target: string;
    meta?: Record<string, unknown>;
  }): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        campusId: params.campusId,
        actorUserId: params.actorUserId ?? null,
        actorLabel: params.actorLabel,
        action: params.action,
        target: params.target,
        meta: (params.meta ?? {}) as object,
      },
    });
  }
}
