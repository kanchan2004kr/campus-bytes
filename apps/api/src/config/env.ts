/** Centralized, typed env access. Never expose secrets to responses/logs. */
export interface AppEnv {
  nodeEnv: string;
  port: number;
  webOrigin: string;
  jwt: { accessSecret: string; refreshSecret: string; accessTtl: string; refreshTtl: string };
  otp: { ttlMinutes: number; maxAttempts: number; resendThrottleSec: number };
  resend: { apiKey?: string; from: string };
  defaultTenantSubdomain: string;
}

const DEV_ACCESS_SECRET = 'dev-access-secret-change-me';
const DEV_REFRESH_SECRET = 'dev-refresh-secret-change-me';

export function loadEnv(): AppEnv {
  const nodeEnv = process.env.NODE_ENV ?? 'development';
  const accessSecret = process.env.JWT_ACCESS_SECRET ?? DEV_ACCESS_SECRET;
  const refreshSecret = process.env.JWT_REFRESH_SECRET ?? DEV_REFRESH_SECRET;

  // Security: never run production on the well-known dev JWT secrets — that would
  // allow anyone to forge access/refresh tokens. Fail fast so the misconfiguration
  // is surfaced instead of silently shipping a token-forgery vulnerability.
  if (nodeEnv === 'production') {
    if (accessSecret === DEV_ACCESS_SECRET || refreshSecret === DEV_REFRESH_SECRET) {
      throw new Error(
        'JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be set to strong, unique values in production.',
      );
    }
  }

  return {
    nodeEnv,
    port: parseInt(process.env.PORT ?? '4000', 10),
    webOrigin: process.env.WEB_ORIGIN ?? 'http://localhost:3000',
    jwt: {
      accessSecret,
      refreshSecret,
      accessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
      refreshTtl: process.env.JWT_REFRESH_TTL ?? '7d',
    },
    otp: {
      ttlMinutes: 10,
      maxAttempts: 5,
      resendThrottleSec: 45,
    },
    resend: {
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.RESEND_FROM_EMAIL ?? 'Campus Bytes <no-reply@campusbytes.app>',
    },
    defaultTenantSubdomain: process.env.DEFAULT_TENANT_SUBDOMAIN ?? 'nims',
  };
}
