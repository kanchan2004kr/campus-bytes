import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { loadEnv } from '../../config/env';

/**
 * Provider-agnostic mail sender. Sends real OTP emails via Resend.
 *
 * - Production: RESEND_API_KEY is required; the OTP is NEVER logged.
 * - Development (only): if RESEND_API_KEY is missing, the code is logged to the
 *   console as a convenience. This fallback is disabled when NODE_ENV=production.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger('Mail');
  private readonly env = loadEnv();
  private readonly resend = this.env.resend.apiKey ? new Resend(this.env.resend.apiKey) : null;
  private readonly isProd = this.env.nodeEnv === 'production';

  async sendOtp(to: string, code: string, name?: string): Promise<void> {
    if (!this.resend) {
      if (this.isProd) {
        // Never silently "succeed" in prod without actually sending.
        throw new InternalServerErrorException('Email service is not configured');
      }
      this.logger.warn(`[DEV OTP] ${to} -> ${code} (set RESEND_API_KEY to send real emails)`);
      return;
    }

    const greeting = name && name.trim() ? name.trim() : 'there';
    const subject = 'Campus Bytes — Your Login OTP';
    const text = [
      `Hello ${greeting},`,
      '',
      'Your Campus Bytes verification code is:',
      '',
      code,
      '',
      'This code expires in 10 minutes.',
      '',
      'If you did not request this code, please ignore this email.',
      '',
      'Campus Bytes',
      'NIMS University',
    ].join('\n');

    try {
      const { error } = await this.resend.emails.send({
        from: this.env.resend.from,
        to,
        subject,
        text,
        html: this.template(greeting, code),
      });
      if (error) {
        this.logger.error(`Resend error: ${error.name} — ${error.message}`);
        throw new InternalServerErrorException('Could not send verification email');
      }
    } catch (e) {
      if (e instanceof InternalServerErrorException) throw e;
      this.logger.error(`Mail send failed: ${(e as Error).message}`);
      throw new InternalServerErrorException('Could not send verification email');
    }
  }

  private template(greeting: string, code: string): string {
    // Inline styles for email-client compatibility. OTP is injected dynamically.
    return `<!doctype html>
<html>
  <body style="margin:0;background:#fff7f0;font-family:'Segoe UI',Helvetica,Arial,sans-serif;color:#1f1b18;">
    <div style="max-width:480px;margin:0 auto;padding:32px 20px;">
      <div style="background:#ffffff;border:1px solid #efe7df;border-radius:16px;padding:28px 28px 32px;">
        <div style="font-size:20px;font-weight:700;letter-spacing:-0.01em;color:#1f1b18;">
          Campus<span style="color:#f0562d;">Bytes</span>
        </div>
        <p style="margin:24px 0 8px;font-size:15px;">Hello ${greeting},</p>
        <p style="margin:0 0 20px;font-size:15px;color:#5b534e;">Your Campus Bytes verification code is:</p>
        <div style="font-size:34px;font-weight:700;letter-spacing:10px;color:#f0562d;background:#fdece2;border-radius:12px;padding:16px 0;text-align:center;">
          ${code}
        </div>
        <p style="margin:20px 0 0;font-size:13px;color:#5b534e;">This code expires in 10 minutes.</p>
        <p style="margin:8px 0 0;font-size:13px;color:#9a918b;">If you did not request this code, please ignore this email.</p>
      </div>
      <p style="margin:20px 0 0;text-align:center;font-size:12px;color:#9a918b;">Campus Bytes · NIMS University</p>
    </div>
  </body>
</html>`;
  }
}
