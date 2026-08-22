import { api } from './api-client';
import { useAuthStore, type SessionUser } from './auth-store';

/**
 * Auth API — matches the NestJS contracts.
 * Students authenticate with real email OTP (signup collects Student ID + Course);
 * restaurant/admin use password login. Tokens are written to the auth store.
 */
interface SessionResponse {
  accessToken: string;
  refreshToken: string;
  user: SessionUser;
}
interface OtpSentResponse {
  sent: true;
  email: string;
}

function persist(res: SessionResponse) {
  useAuthStore.getState().setSession(res);
  return res;
}

// ── Student: approved-roster gated registration ──────────────────────
export type CheckIdResult =
  | { status: 'ok'; name: string }
  | { status: 'not_found' }
  | { status: 'already_registered' };

export async function checkStudentId(studentId: string): Promise<CheckIdResult> {
  return api.post('/auth/student/check-id', { studentId: studentId.trim() });
}

export async function registerSendOtp(studentId: string, email: string): Promise<OtpSentResponse> {
  return api.post('/auth/student/register/send-otp', {
    studentId: studentId.trim(),
    email: email.trim().toLowerCase(),
  });
}

export async function registerVerifyOtp(studentId: string, email: string, code: string): Promise<{ verified: true }> {
  return api.post('/auth/student/register/verify-otp', {
    studentId: studentId.trim(),
    email: email.trim().toLowerCase(),
    code,
  });
}

export async function registerComplete(studentId: string, email: string, password: string): Promise<SessionResponse> {
  const res = await api.post<SessionResponse>('/auth/student/register/complete', {
    studentId: studentId.trim(),
    email: email.trim().toLowerCase(),
    password,
  });
  return persist(res);
}

export async function studentForgotById(studentId: string): Promise<{ sent: true; email?: string }> {
  return api.post('/auth/student/forgot-password-by-id', { studentId: studentId.trim() });
}

export async function studentResetById(studentId: string, code: string, password: string): Promise<{ ok: true }> {
  return api.post('/auth/student/reset-password-by-id', { studentId: studentId.trim(), code, password });
}

// ── Student: password auth (signup verifies email via OTP) ───────────
export async function studentSignup(input: {
  name: string;
  studentId: string;
  course: string;
  email: string;
  password: string;
}): Promise<OtpSentResponse> {
  return api.post('/auth/student/signup', {
    name: input.name.trim(),
    studentId: input.studentId.trim(),
    course: input.course.trim(),
    email: input.email.trim().toLowerCase(),
    password: input.password,
  });
}

/** Normal login: email or Student ID + password (no OTP). */
export async function studentLogin(identifier: string, password: string): Promise<SessionResponse> {
  const res = await api.post<SessionResponse>('/auth/student/login', {
    identifier: identifier.trim(),
    password,
  });
  return persist(res);
}

export async function studentResendOtp(email: string): Promise<OtpSentResponse> {
  return api.post('/auth/student/resend-otp', { email: email.trim().toLowerCase() });
}

/** Signup email verification → creates the account and logs the student in. */
export async function studentVerifyOtp(email: string, code: string): Promise<SessionResponse> {
  const res = await api.post<SessionResponse>('/auth/student/verify-otp', {
    email: email.trim().toLowerCase(),
    code,
  });
  return persist(res);
}

// ── Student: forgot / reset password ─────────────────────────────────
export async function studentForgotPassword(email: string): Promise<{ sent: true }> {
  return api.post('/auth/student/forgot-password', { email: email.trim().toLowerCase() });
}

export async function studentResetPassword(
  email: string,
  code: string,
  password: string,
): Promise<{ ok: true }> {
  return api.post('/auth/student/reset-password', {
    email: email.trim().toLowerCase(),
    code,
    password,
  });
}

// ── Restaurant / Admin (password) ────────────────────────────────────
export async function restaurantLogin(email: string, password: string): Promise<SessionResponse> {
  const res = await api.post<SessionResponse>('/auth/restaurant/login', {
    email: email.trim().toLowerCase(),
    password,
  });
  return persist(res);
}

export async function adminLogin(email: string, password: string): Promise<SessionResponse> {
  const res = await api.post<SessionResponse>('/auth/admin/login', {
    email: email.trim().toLowerCase(),
    password,
  });
  return persist(res);
}

// ── Admin: forgot / reset password (OTP to a private recovery email) ──
export async function adminForgotPassword(email: string): Promise<{ sent: true }> {
  return api.post('/auth/admin/forgot-password', { email: email.trim().toLowerCase() });
}

export async function adminResetPassword(
  email: string,
  code: string,
  password: string,
): Promise<{ ok: true }> {
  return api.post('/auth/admin/reset-password', {
    email: email.trim().toLowerCase(),
    code,
    password,
  });
}

// ── Restaurant owner: change / forgot / reset password ──────────────
export async function restaurantChangePassword(
  oldPassword: string,
  newPassword: string,
): Promise<{ ok: true }> {
  return api.post('/auth/restaurant/change-password', { oldPassword, newPassword });
}

export async function restaurantForgotPassword(email: string): Promise<{ sent: true }> {
  return api.post('/auth/restaurant/forgot-password', { email: email.trim().toLowerCase() });
}

export async function restaurantResetPassword(
  email: string,
  code: string,
  password: string,
): Promise<{ ok: true }> {
  return api.post('/auth/restaurant/reset-password', {
    email: email.trim().toLowerCase(),
    code,
    password,
  });
}

export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } catch {
    // Even if the server call fails, clear the local session.
  }
  useAuthStore.getState().clear();
}
