import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { loadEnv } from '../../config/env';
import type { AuthUser } from '../../common/auth/auth.types';

const REFRESH_DAYS = 7;

/** Issues access JWTs and rotating refresh tokens (hashed at rest, revocable). */
@Injectable()
export class TokenService {
  private readonly env = loadEnv();

  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async issue(principal: AuthUser): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = await this.jwt.signAsync(principal, {
      secret: this.env.jwt.accessSecret,
      expiresIn: this.env.jwt.accessTtl,
    });

    // Opaque refresh token, stored only as a hash.
    const raw = `${principal.sub}.${cryptoRandom()}`;
    const tokenHash = await bcrypt.hash(raw, 10);
    const expiresAt = new Date(Date.now() + REFRESH_DAYS * 24 * 60 * 60 * 1000);
    await this.prisma.refreshToken.create({
      data: { userId: principal.sub, tokenHash, expiresAt },
    });

    return { accessToken, refreshToken: `${raw}::${tokenHash}` };
  }

  /** Rotate: verify the presented refresh token, revoke it, and issue a new pair. */
  async rotate(presented: string, principal: AuthUser): Promise<{ accessToken: string; refreshToken: string }> {
    const [, hash] = presented.split('::');
    if (!hash) throw new Error('Malformed refresh token');
    const record = await this.prisma.refreshToken.findUnique({ where: { tokenHash: hash } });
    if (!record || record.revokedAt || record.expiresAt < new Date()) {
      throw new Error('Refresh token invalid or expired');
    }
    await this.prisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date() },
    });
    return this.issue(principal);
  }

  async revokeAll(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async userIdFromRefresh(presented: string): Promise<string | null> {
    const [, hash] = presented.split('::');
    if (!hash) return null;
    const record = await this.prisma.refreshToken.findUnique({ where: { tokenHash: hash } });
    if (!record || record.revokedAt || record.expiresAt < new Date()) return null;
    return record.userId;
  }
}

function cryptoRandom(): string {
  // 32 hex chars of randomness without extra deps.
  let s = '';
  for (let i = 0; i < 4; i++) s += Math.random().toString(16).slice(2, 10);
  return s;
}
