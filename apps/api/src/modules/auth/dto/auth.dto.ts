import { IsEmail, IsString, Length, Matches, MaxLength, MinLength } from 'class-validator';

export class StudentSignupDto {
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
}

/** Login: accepts an email or a Student ID. */
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

export class RefreshDto {
  @IsString()
  @Length(10, 512)
  refreshToken!: string;
}
