import { BadRequestException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { loadEnv } from '../../config/env';
import { TooManyRequestsException } from '../../common/too-many-requests.exception';

/**
 * OTP issuance + verification. Codes are hashed at rest (bcrypt), expire in 10 min,
 * are throttled (1 per 45s), lock out after 5 failed attempts, and every new code
 * invalidates prior unconsumed codes for that user (PRD §11.4).
 */
@Injectable()
export class OtpService {
  private readonly env = loadEnv();

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  async issue(userId: string, email: string, name?: string): Promise<void> {
    const latest = await this.prisma.otpCode.findFirst({
      where: { userId, consumedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    if (latest) {
      const ageSec = (Date.now() - latest.createdAt.getTime()) / 1000;
      if (ageSec < this.env.otp.resendThrottleSec) {
        throw new TooManyRequestsException('Too many requests. Please wait before requesting another OTP.');
      }
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + this.env.otp.ttlMinutes * 60 * 1000);

    // Invalidate any previous unconsumed codes so only the newest is valid.
    await this.prisma.otpCode.updateMany({
      where: { userId, consumedAt: null },
      data: { consumedAt: new Date() },
    });

    // Send the email first; only persist the code if the email actually went out.
    await this.mail.sendOtp(email, code, name);
    await this.prisma.otpCode.create({ data: { userId, codeHash, expiresAt } });
  }

  /** Verify a code; returns true on success, throws on lockout/expiry/invalid. */
  async verify(userId: string, code: string): Promise<boolean> {
    const otp = await this.prisma.otpCode.findFirst({
      where: { userId, consumedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    if (!otp) throw new BadRequestException('No active code. Request a new one.');
    if (otp.expiresAt < new Date()) throw new BadRequestException('Code expired. Request a new one.');
    if (otp.attempts >= this.env.otp.maxAttempts) {
      throw new TooManyRequestsException('Too many attempts. Request a new code.');
    }

    const ok = await bcrypt.compare(code, otp.codeHash);
    if (!ok) {
      await this.prisma.otpCode.update({
        where: { id: otp.id },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException('Incorrect code');
    }

    await this.prisma.otpCode.update({
      where: { id: otp.id },
      data: { consumedAt: new Date() },
    });
    return true;
  }
}
