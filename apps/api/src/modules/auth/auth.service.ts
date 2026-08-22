import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UserRole } from '@campus-bytes/types';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantService } from '../tenant/tenant.service';
import { OtpService } from './otp.service';
import { TokenService } from './token.service';
import { MailService } from '../mail/mail.service';
import { loadEnv } from '../../config/env';
import { TooManyRequestsException } from '../../common/too-many-requests.exception';
import type { AuthUser } from '../../common/auth/auth.types';

@Injectable()
export class AuthService {
  private readonly env = loadEnv();

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantService,
    private readonly otp: OtpService,
    private readonly tokens: TokenService,
    private readonly mail: MailService,
  ) {}

  // ── Student: approved-roster gated registration ─────────────────────
  private normId(s: string) {
    return s.trim().toUpperCase().replace(/\s+/g, '');
  }
  private maskEmail(email: string) {
    const [u, d] = email.split('@');
    if (!d) return email;
    const head = u.slice(0, Math.min(2, u.length));
    return `${head}${'*'.repeat(Math.max(1, u.length - head.length))}@${d}`;
  }

  /** Step 1: verify a Student ID against the approved roster + registration state. */
  async checkStudentId(studentIdRaw: string) {
    const campusId = await this.tenant.getDefaultCampusId();
    const studentId = this.normId(studentIdRaw);
    const approved = await this.prisma.approvedStudent.findUnique({
      where: { campusId_studentId: { campusId, studentId } },
    });
    if (!approved) return { status: 'not_found' as const };
    const existing = await this.prisma.user.findFirst({
      where: { campusId, studentId, role: UserRole.STUDENT, verified: true },
    });
    if (existing) return { status: 'already_registered' as const };
    return { status: 'ok' as const, name: approved.name };
  }

  /** Step 2: email + Send OTP. Creates/updates a server-side pending registration. */
  async registerSendOtp(studentIdRaw: string, emailRaw: string) {
    const campusId = await this.tenant.getDefaultCampusId();
    const studentId = this.normId(studentIdRaw);
    const email = emailRaw.toLowerCase().trim();

    const approved = await this.prisma.approvedStudent.findUnique({
      where: { campusId_studentId: { campusId, studentId } },
    });
    if (!approved) {
      throw new BadRequestException(
        'Student ID not found. Registration is available only for authorized NIMS students.',
      );
    }
    const already = await this.prisma.user.findFirst({
      where: { campusId, studentId, role: UserRole.STUDENT, verified: true },
    });
    if (already) {
      throw new ConflictException('This Student ID is already registered. Please sign in instead.');
    }
    const emailClash = await this.prisma.user.findFirst({
      where: { campusId, email, role: UserRole.STUDENT, verified: true, studentId: { not: studentId } },
    });
    if (emailClash) {
      throw new ConflictException('This email is already used by another account.');
    }

    // Throttle re-sends per pending attempt.
    const existing = await this.prisma.pendingRegistration.findUnique({
      where: { campusId_studentId: { campusId, studentId } },
    });
    if (existing) {
      const ageSec = (Date.now() - existing.updatedAt.getTime()) / 1000;
      if (ageSec < this.env.otp.resendThrottleSec) {
        throw new TooManyRequestsException('Please wait before requesting another OTP.');
      }
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + this.env.otp.ttlMinutes * 60 * 1000);

    // Send first — if it fails, persist nothing (no rate-limit on a non-delivered code).
    await this.mail.sendOtp(email, code, approved.name);

    await this.prisma.pendingRegistration.upsert({
      where: { campusId_studentId: { campusId, studentId } },
      create: { campusId, studentId, name: approved.name, email, codeHash, expiresAt, attempts: 0 },
      update: { email, name: approved.name, codeHash, expiresAt, attempts: 0, verifiedAt: null },
    });
    return { sent: true, email };
  }

  /** Step 3: verify the emailed OTP for a pending registration. */
  async registerVerifyOtp(studentIdRaw: string, emailRaw: string, code: string) {
    const campusId = await this.tenant.getDefaultCampusId();
    const studentId = this.normId(studentIdRaw);
    const email = emailRaw.toLowerCase().trim();
    const pending = await this.prisma.pendingRegistration.findUnique({
      where: { campusId_studentId: { campusId, studentId } },
    });
    if (!pending || pending.email !== email) {
      throw new BadRequestException('No active code. Please request a new OTP.');
    }
    if (pending.expiresAt < new Date()) throw new BadRequestException('Code expired. Request a new one.');
    if (pending.attempts >= this.env.otp.maxAttempts) {
      throw new TooManyRequestsException('Too many attempts. Request a new code.');
    }
    const ok = await bcrypt.compare(code, pending.codeHash);
    if (!ok) {
      await this.prisma.pendingRegistration.update({
        where: { id: pending.id },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException('Incorrect code');
    }
    await this.prisma.pendingRegistration.update({
      where: { id: pending.id },
      data: { verifiedAt: new Date() },
    });
    return { verified: true };
  }

  /** Step 4: set password → create the real account (only now). */
  async registerComplete(studentIdRaw: string, emailRaw: string, password: string) {
    const campusId = await this.tenant.getDefaultCampusId();
    const studentId = this.normId(studentIdRaw);
    const email = emailRaw.toLowerCase().trim();
    const pending = await this.prisma.pendingRegistration.findUnique({
      where: { campusId_studentId: { campusId, studentId } },
    });
    if (!pending || pending.email !== email || !pending.verifiedAt) {
      throw new BadRequestException('Please verify your email with the OTP first.');
    }
    // Re-check eligibility at commit time (never trust an earlier step).
    const approved = await this.prisma.approvedStudent.findUnique({
      where: { campusId_studentId: { campusId, studentId } },
    });
    if (!approved) throw new BadRequestException('Student ID is not authorized.');
    const already = await this.prisma.user.findFirst({
      where: { campusId, studentId, role: UserRole.STUDENT, verified: true },
    });
    if (already) throw new ConflictException('This Student ID is already registered. Please sign in instead.');

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: {
        campusId,
        email,
        role: UserRole.STUDENT,
        name: approved.name,
        studentId,
        passwordHash,
        verified: true,
      },
    });
    await this.prisma.pendingRegistration.delete({ where: { id: pending.id } }).catch(() => undefined);
    return this.issueSession({ sub: user.id, role: UserRole.STUDENT, campusId });
  }

  /** Forgot password: student enters Student ID → OTP to their registered email. */
  async studentForgotByStudentId(studentIdRaw: string) {
    const campusId = await this.tenant.getDefaultCampusId();
    const studentId = this.normId(studentIdRaw);
    const user = await this.prisma.user.findFirst({
      where: { campusId, studentId, role: UserRole.STUDENT, verified: true },
    });
    if (!user || user.status === 'blocked') {
      // Generic — never disclose whether the Student ID is registered.
      return { sent: true };
    }
    try {
      await this.otp.issue(user.id, user.email, user.name);
    } catch {
      // Swallow throttle/send errors — never leak existence.
    }
    return { sent: true, email: this.maskEmail(user.email) };
  }

  async studentResetByStudentId(studentIdRaw: string, code: string, newPassword: string) {
    const campusId = await this.tenant.getDefaultCampusId();
    const studentId = this.normId(studentIdRaw);
    const user = await this.prisma.user.findFirst({
      where: { campusId, studentId, role: UserRole.STUDENT, verified: true },
    });
    if (!user) throw new BadRequestException('Invalid or expired OTP.');
    await this.otp.verify(user.id, code); // throws on invalid/expired/lockout
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    await this.tokens.revokeAll(user.id);
    return { ok: true };
  }

  // ── Student: signup (Student ID + Course + Email) ───────────────────
  async studentSignup(input: {
    name: string;
    studentId: string;
    course: string;
    email: string;
    password: string;
  }) {
    const campusId = await this.tenant.getDefaultCampusId();
    const email = input.email.toLowerCase().trim();
    const studentId = input.studentId.trim();
    const course = input.course.trim();
    const fullName = input.name.trim();
    const passwordHash = await bcrypt.hash(input.password, 10);

    // Email already registered & verified → they should log in instead.
    const byEmail = await this.prisma.user.findFirst({
      where: { campusId, email, role: UserRole.STUDENT },
    });
    if (byEmail?.verified) {
      throw new ConflictException('This email is already registered. Please log in instead.');
    }

    // Student ID taken by a different (verified) account.
    const byStudentId = await this.prisma.user.findFirst({
      where: { campusId, studentId, role: UserRole.STUDENT },
    });
    if (byStudentId && byStudentId.email !== email) {
      throw new ConflictException('This Student ID is already registered.');
    }

    // Create or resume an unverified signup for this email. The student's real
    // full name (collected at signup) is stored — never derived from the email.
    const name = fullName || 'Student';
    const user = byEmail
      ? await this.prisma.user.update({
          where: { id: byEmail.id },
          data: { studentId, course, name, passwordHash },
        })
      : await this.prisma.user.create({
          data: { campusId, email, role: UserRole.STUDENT, studentId, course, name, passwordHash },
        });

    await this.otp.issue(user.id, email, name);
    return { sent: true, email };
  }

  // ── Student: login (request OTP by email or Student ID) ─────────────
  async studentRequestOtp(identifier: string) {
    const campusId = await this.tenant.getDefaultCampusId();
    const id = identifier.trim();
    const user = id.includes('@')
      ? await this.prisma.user.findFirst({ where: { campusId, email: id.toLowerCase(), role: UserRole.STUDENT } })
      : await this.prisma.user.findFirst({ where: { campusId, studentId: id, role: UserRole.STUDENT } });

    if (!user) throw new NotFoundException('No account found. Please sign up first.');
    if (user.status === 'blocked') throw new UnauthorizedException('Your account has been blocked.');

    await this.otp.issue(user.id, user.email, user.name);
    return { sent: true, email: user.email };
  }

  /** Resend works for both a pending signup and a login by the same email. */
  async studentResendOtp(email: string) {
    const campusId = await this.tenant.getDefaultCampusId();
    const normalized = email.toLowerCase().trim();
    const user = await this.prisma.user.findFirst({
      where: { campusId, email: normalized, role: UserRole.STUDENT },
    });
    if (!user) throw new NotFoundException('No pending verification for this email.');
    if (user.status === 'blocked') throw new UnauthorizedException('Your account has been blocked.');

    await this.otp.issue(user.id, user.email, user.name);
    return { sent: true, email: user.email };
  }

  async studentVerifyOtp(email: string, code: string) {
    const campusId = await this.tenant.getDefaultCampusId();
    const normalized = email.toLowerCase().trim();
    const user = await this.prisma.user.findFirst({
      where: { campusId, email: normalized, role: UserRole.STUDENT },
    });
    if (!user) throw new BadRequestException('No account for this email. Please sign up.');
    if (user.status === 'blocked') throw new UnauthorizedException('Your account has been blocked.');

    await this.otp.verify(user.id, code);
    if (!user.verified) {
      await this.prisma.user.update({ where: { id: user.id }, data: { verified: true } });
    }
    return this.issueSession({ sub: user.id, role: UserRole.STUDENT, campusId });
  }

  // ── Student: password login (email or Student ID) ───────────────────
  async studentLogin(identifier: string, password: string) {
    const campusId = await this.tenant.getDefaultCampusId();
    const id = identifier.trim();
    const user = id.includes('@')
      ? await this.prisma.user.findFirst({
          where: { campusId, email: id.toLowerCase(), role: UserRole.STUDENT },
        })
      : await this.prisma.user.findFirst({
          where: { campusId, studentId: id, role: UserRole.STUDENT },
        });

    // Generic error — never reveal whether the account exists or is unverified.
    const invalid = () => new UnauthorizedException('Invalid email/Student ID or password.');
    if (!user || !user.passwordHash) throw invalid();
    if (user.status === 'blocked') throw new UnauthorizedException('Your account has been blocked.');
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw invalid();
    if (!user.verified) {
      throw new UnauthorizedException('Please verify your email before logging in.');
    }
    return this.issueSession({ sub: user.id, role: UserRole.STUDENT, campusId });
  }

  // ── Student: forgot / reset password (OTP to registered email) ──────
  async studentForgotPassword(email: string) {
    const campusId = await this.tenant.getDefaultCampusId();
    const normalized = email.toLowerCase().trim();
    const user = await this.prisma.user.findFirst({
      where: { campusId, email: normalized, role: UserRole.STUDENT },
    });
    // Only send to a real, verified student; always return a generic response
    // (even if the send fails) so we never disclose whether an email is
    // registered via status codes.
    if (user && user.verified && user.status !== 'blocked') {
      try {
        await this.otp.issue(user.id, user.email, user.name);
      } catch {
        // Swallow send/throttle errors — never leak account existence.
      }
    }
    return { sent: true };
  }

  async studentResetPassword(email: string, code: string, newPassword: string) {
    const campusId = await this.tenant.getDefaultCampusId();
    const normalized = email.toLowerCase().trim();
    const user = await this.prisma.user.findFirst({
      where: { campusId, email: normalized, role: UserRole.STUDENT },
    });
    if (!user) throw new BadRequestException('Invalid or expired OTP.');
    await this.otp.verify(user.id, code); // throws on invalid/expired/lockout
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    return { ok: true };
  }

  // ── Admin: forgot / reset password (OTP to a private recovery email) ──
  async adminForgotPassword(email: string) {
    const campusId = await this.tenant.getDefaultCampusId();
    const normalized = email.toLowerCase().trim();
    const admin = await this.prisma.user.findFirst({
      where: { campusId, email: normalized, role: UserRole.ADMIN },
    });
    // Recovery address is backend-only (never in the frontend/source). If it's
    // not configured, we simply don't send — but still return a generic response.
    const recovery = process.env.ADMIN_RECOVERY_EMAIL?.trim();
    if (admin && admin.status !== 'blocked' && recovery) {
      try {
        // OTP is bound to the admin account but delivered to the trusted recovery
        // inbox, not the admin's own login email.
        await this.otp.issue(admin.id, recovery, admin.name);
      } catch {
        // Never leak whether the account exists via errors.
      }
    }
    return { sent: true };
  }

  async adminResetPassword(email: string, code: string, newPassword: string) {
    const campusId = await this.tenant.getDefaultCampusId();
    const normalized = email.toLowerCase().trim();
    const admin = await this.prisma.user.findFirst({
      where: { campusId, email: normalized, role: UserRole.ADMIN },
    });
    if (!admin) throw new BadRequestException('Invalid or expired OTP.');
    await this.otp.verify(admin.id, code); // throws on invalid/expired/lockout
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { id: admin.id }, data: { passwordHash } });
    // Force re-login everywhere (old sessions/passwords stop working).
    await this.tokens.revokeAll(admin.id);
    return { ok: true };
  }

  // ── Restaurant owner: change / forgot / reset password ──────────────
  async restaurantChangePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== UserRole.RESTAURANT || !user.passwordHash) {
      throw new UnauthorizedException('Not allowed');
    }
    const ok = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Current password is incorrect.');
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    return { ok: true };
  }

  async restaurantForgotPassword(email: string) {
    const campusId = await this.tenant.getDefaultCampusId();
    const normalized = email.toLowerCase().trim();
    const user = await this.prisma.user.findFirst({
      where: { campusId, email: normalized, role: UserRole.RESTAURANT },
    });
    if (user && user.status !== 'blocked') {
      try {
        await this.otp.issue(user.id, user.email, user.name);
      } catch {
        // Never leak account existence via errors.
      }
    }
    return { sent: true };
  }

  async restaurantResetPassword(email: string, code: string, newPassword: string) {
    const campusId = await this.tenant.getDefaultCampusId();
    const normalized = email.toLowerCase().trim();
    const user = await this.prisma.user.findFirst({
      where: { campusId, email: normalized, role: UserRole.RESTAURANT },
    });
    if (!user) throw new BadRequestException('Invalid or expired OTP.');
    await this.otp.verify(user.id, code);
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    await this.tokens.revokeAll(user.id);
    return { ok: true };
  }

  // ── Restaurant / Admin: password ────────────────────────────────────
  async passwordLogin(email: string, password: string, role: UserRole) {
    const campusId = await this.tenant.getDefaultCampusId();
    const normalized = email.toLowerCase().trim();
    const user = await this.prisma.user.findFirst({
      where: { campusId, email: normalized, role },
    });
    if (!user || !user.passwordHash) throw new UnauthorizedException('Invalid credentials');
    if (user.status === 'blocked') throw new UnauthorizedException('Account blocked');

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const restaurant =
      role === UserRole.RESTAURANT
        ? await this.prisma.restaurant.findUnique({ where: { ownerUserId: user.id } })
        : null;

    return this.issueSession({
      sub: user.id,
      role,
      campusId,
      ...(restaurant ? { restaurantId: restaurant.id } : {}),
    });
  }

  async refresh(refreshToken: string) {
    const userId = await this.tokens.userIdFromRefresh(refreshToken);
    if (!userId) throw new UnauthorizedException('Invalid refresh token');
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Invalid refresh token');
    const restaurant =
      user.role === UserRole.RESTAURANT
        ? await this.prisma.restaurant.findUnique({ where: { ownerUserId: user.id } })
        : null;
    const principal: AuthUser = {
      sub: user.id,
      role: user.role as UserRole,
      campusId: user.campusId,
      ...(restaurant ? { restaurantId: restaurant.id } : {}),
    };
    const pair = await this.tokens.rotate(refreshToken, principal);
    return { ...pair, user: this.publicUser(user) };
  }

  async logout(userId: string): Promise<{ ok: true }> {
    await this.tokens.revokeAll(userId);
    return { ok: true };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { hostel: true, room: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return this.publicUser(user);
  }

  // ── helpers ─────────────────────────────────────────────────────────
  private async issueSession(principal: AuthUser) {
    const pair = await this.tokens.issue(principal);
    const user = await this.prisma.user.findUnique({ where: { id: principal.sub } });
    return { ...pair, user: this.publicUser(user!) };
  }

  private publicUser(u: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: string;
    status: string;
    hostelId: string | null;
    roomId: string | null;
    verified: boolean;
  }) {
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      status: u.status,
      hostelId: u.hostelId,
      roomId: u.roomId,
      verified: u.verified,
    };
  }
}
