import { Body, Controller, Get, Post, HttpCode } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { UserRole } from '@campus-bytes/types';
import { AuthService } from './auth.service';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  OtpVerifyDto,
  PasswordLoginDto,
  RefreshDto,
  ResetPasswordDto,
  StudentLoginDto,
  StudentResendDto,
  StudentSignupDto,
} from './dto/auth.dto';
import { Public } from '../../common/auth/public.decorator';
import { Roles } from '../../common/auth/roles.decorator';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { AuthUser } from '../../common/auth/auth.types';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  // ── Student: password auth (signup verifies email via OTP) ─────────
  @Public()
  @Throttle({ default: { limit: 4, ttl: 60_000 } })
  @Post('student/signup')
  @HttpCode(200)
  studentSignup(@Body() dto: StudentSignupDto) {
    return this.auth.studentSignup(dto);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('student/login')
  @HttpCode(200)
  studentLogin(@Body() dto: StudentLoginDto) {
    return this.auth.studentLogin(dto.identifier, dto.password);
  }

  @Public()
  @Throttle({ default: { limit: 4, ttl: 60_000 } })
  @Post('student/resend-otp')
  @HttpCode(200)
  studentResendOtp(@Body() dto: StudentResendDto) {
    return this.auth.studentResendOtp(dto.email);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('student/verify-otp')
  @HttpCode(200)
  studentVerifyOtp(@Body() dto: OtpVerifyDto) {
    return this.auth.studentVerifyOtp(dto.email, dto.code);
  }

  @Public()
  @Throttle({ default: { limit: 4, ttl: 60_000 } })
  @Post('student/forgot-password')
  @HttpCode(200)
  studentForgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.studentForgotPassword(dto.email);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('student/reset-password')
  @HttpCode(200)
  studentResetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.studentResetPassword(dto.email, dto.code, dto.password);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('restaurant/login')
  @HttpCode(200)
  restaurantLogin(@Body() dto: PasswordLoginDto) {
    return this.auth.passwordLogin(dto.email, dto.password, UserRole.RESTAURANT);
  }

  @Roles(UserRole.RESTAURANT)
  @Post('restaurant/change-password')
  @HttpCode(200)
  restaurantChangePassword(@CurrentUser() user: AuthUser, @Body() dto: ChangePasswordDto) {
    return this.auth.restaurantChangePassword(user.sub, dto.oldPassword, dto.newPassword);
  }

  @Public()
  @Throttle({ default: { limit: 4, ttl: 60_000 } })
  @Post('restaurant/forgot-password')
  @HttpCode(200)
  restaurantForgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.restaurantForgotPassword(dto.email);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('restaurant/reset-password')
  @HttpCode(200)
  restaurantResetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.restaurantResetPassword(dto.email, dto.code, dto.password);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('admin/login')
  @HttpCode(200)
  adminLogin(@Body() dto: PasswordLoginDto) {
    return this.auth.passwordLogin(dto.email, dto.password, UserRole.ADMIN);
  }

  @Public()
  @Throttle({ default: { limit: 4, ttl: 60_000 } })
  @Post('admin/forgot-password')
  @HttpCode(200)
  adminForgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.adminForgotPassword(dto.email);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('admin/reset-password')
  @HttpCode(200)
  adminResetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.adminResetPassword(dto.email, dto.code, dto.password);
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(200)
  logout(@CurrentUser() user: AuthUser) {
    return this.auth.logout(user.sub);
  }

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user.sub);
  }
}
