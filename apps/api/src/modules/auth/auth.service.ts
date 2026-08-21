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
import type { AuthUser } from '../../common/auth/auth.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantService,
    private readonly otp: OtpService,
    private readonly tokens: TokenService,
  ) {}

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
