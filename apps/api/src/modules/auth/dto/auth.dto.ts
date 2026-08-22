import { IsEmail, IsString, Length, Matches, MaxLength, MinLength } from 'class-validator';

export class StudentSignupDto {
  @IsString({ message: 'Full name is required' })
  @MinLength(2, { message: 'Enter your full name' })
  @MaxLength(80)
  name!: string;

  @IsString({ message: 'Student ID is required' })
  @MinLength(3, { message: 'Enter a valid Student ID' })
  @MaxLength(40)
  studentId!: string;

  @IsString({ message: 'Course / program is required' })
  @MinLength(2, { message: 'Enter your course / program' })
  @MaxLength(80)
  course!: string;

  @IsEmail({}, { message: 'Enter a valid email address' })
  email!: string;

  @IsString({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(72, { message: 'Password is too long' })
  password!: string;
}

/** Normal student login — email or Student ID + password (no OTP). */
export class StudentLoginDto {
  @IsString()
  @MinLength(3, { message: 'Enter your email or Student ID' })
  @MaxLength(120)
  identifier!: string;

  @IsString({ message: 'Password is required' })
  @MinLength(1)
  @MaxLength(72)
  password!: string;
}

/** Forgot password — send a reset OTP to the registered email. */
export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Enter a valid email address' })
  email!: string;
}

/** Reset password with the emailed OTP. */
export class ResetPasswordDto {
  @IsEmail({}, { message: 'Enter a valid email address' })
  email!: string;

  @Matches(/^\d{6}$/, { message: 'OTP must be 6 digits' })
  code!: string;

  @IsString({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(72, { message: 'Password is too long' })
  password!: string;
}

/** Login: accepts an email or a Student ID (legacy OTP request — signup only). */
export class StudentOtpRequestDto {
  @IsString()
  @MinLength(3, { message: 'Enter your email or Student ID' })
  @MaxLength(120)
  identifier!: string;
}

export class StudentResendDto {
  @IsEmail({}, { message: 'Enter a valid email address' })
  email!: string;
}

// ── Approved-student gated registration ──────────────────────────────
export class CheckStudentIdDto {
  @IsString({ message: 'Student ID is required' })
  @MinLength(3, { message: 'Enter a valid Student ID' })
  @MaxLength(40)
  studentId!: string;
}

export class RegisterSendOtpDto {
  @IsString({ message: 'Student ID is required' })
  @MinLength(3, { message: 'Enter a valid Student ID' })
  @MaxLength(40)
  studentId!: string;

  @IsEmail({}, { message: 'Enter a valid email address' })
  email!: string;
}

export class RegisterVerifyDto {
  @IsString() @MinLength(3) @MaxLength(40)
  studentId!: string;

  @IsEmail({}, { message: 'Enter a valid email address' })
  email!: string;

  @Matches(/^\d{6}$/, { message: 'OTP must be 6 digits' })
  code!: string;
}

export class RegisterCompleteDto {
  @IsString() @MinLength(3) @MaxLength(40)
  studentId!: string;

  @IsEmail({}, { message: 'Enter a valid email address' })
  email!: string;

  @IsString({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(72, { message: 'Password is too long' })
  password!: string;
}

export class StudentForgotByIdDto {
  @IsString({ message: 'Student ID is required' })
  @MinLength(3, { message: 'Enter a valid Student ID' })
  @MaxLength(40)
  studentId!: string;
}

export class StudentResetByIdDto {
  @IsString() @MinLength(3) @MaxLength(40)
  studentId!: string;

  @Matches(/^\d{6}$/, { message: 'OTP must be 6 digits' })
  code!: string;

  @IsString({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(72, { message: 'Password is too long' })
  password!: string;
}

export class OtpVerifyDto {
  @IsEmail({}, { message: 'Enter a valid email address' })
  email!: string;

  @Matches(/^\d{6}$/, { message: 'OTP must be 6 digits' })
  code!: string;
}

export class PasswordLoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

/** Change password while authenticated (restaurant owner). */
export class ChangePasswordDto {
  @IsString({ message: 'Current password is required' })
  @MinLength(1)
  @MaxLength(72)
  oldPassword!: string;

  @IsString({ message: 'New password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(72)
  newPassword!: string;
}

export class RefreshDto {
  @IsString()
  @Length(10, 512)
  refreshToken!: string;
}
