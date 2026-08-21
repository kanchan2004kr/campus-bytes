import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Rate-limit guard used app-wide. For the student OTP endpoints it tracks by the
 * submitted email/identifier instead of the client IP, so students sharing a
 * campus NAT/public IP don't rate-limit each other. All other routes keep the
 * standard per-IP tracking.
 */
@Injectable()
export class OtpThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const url: string = req.originalUrl ?? req.url ?? '';
    if (url.includes('/auth/student/')) {
      const body = (req.body ?? {}) as { email?: unknown; identifier?: unknown };
      const id = String(body.email ?? body.identifier ?? '')
        .trim()
        .toLowerCase();
      if (id) return `otp:${id}`;
    }
    // Default: per-IP (honour proxy-forwarded client IP when present).
    return req.ips?.length ? req.ips[0] : req.ip;
  }
}
