import { Body, Controller, Get, Post, HttpCode } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { UserRole } from '@campus-bytes/types';
import { AuthService } from './auth.service';
import {
  OtpVerifyDto,
  PasswordLoginDto,
  RefreshDto,
  StudentOtpRequestDto,
  StudentResendDto,
  StudentSignupDto,
} from './dto/auth.dto';
import { Public } from '../../common/auth/public.decorator';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { AuthUser } from '../../common/auth/auth.types';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  // ── Student: real email-OTP auth ──────────────────────────────────
  @Public()
  @Throttle({ default: { limit: 4, ttl: 60_000 } })
  @Post('student/signup')
  @HttpCode(200)
  studentSignup(@Body() dto: StudentSignupDto) {
    return this.auth.studentSignup(dto);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('student/request-otp')
  @HttpCode(200)
  studentRequestOtp(@Body() dto: StudentOtpRequestDto) {
    return this.auth.studentRequestOtp(dto.identifier);
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
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('restaurant/login')
  @HttpCode(200)
  restaurantLogin(@Body() dto: PasswordLoginDto) {
    return this.auth.passwordLogin(dto.email, dto.password, UserRole.RESTAURANT);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('admin/login')
  @HttpCode(200)
  adminLogin(@Body() dto: PasswordLoginDto) {
    return this.auth.passwordLogin(dto.email, dto.password, UserRole.ADMIN);
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
