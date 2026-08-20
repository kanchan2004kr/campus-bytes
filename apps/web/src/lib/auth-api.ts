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

// ── Student signup / login (real email OTP) ──────────────────────────
export async function studentSignup(input: {
  studentId: string;
  course: string;
  email: string;
}): Promise<OtpSentResponse> {
  return api.post('/auth/student/signup', {
    studentId: input.studentId.trim(),
    course: input.course.trim(),
    email: input.email.trim().toLowerCase(),
  });
}

/** Login: identifier is an email or Student ID. Returns the email to verify against. */
export async function studentRequestOtp(identifier: string): Promise<OtpSentResponse> {
  return api.post('/auth/student/request-otp', { identifier: identifier.trim() });
}

export async function studentResendOtp(email: string): Promise<OtpSentResponse> {
  return api.post('/auth/student/resend-otp', { email: email.trim().toLowerCase() });
}

export async function studentVerifyOtp(email: string, code: string): Promise<SessionResponse> {
  const res = await api.post<SessionResponse>('/auth/student/verify-otp', {
    email: email.trim().toLowerCase(),
    code,
  });
  return persist(res);
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

export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } catch {
    // Even if the server call fails, clear the local session.
  }
  useAuthStore.getState().clear();
}
