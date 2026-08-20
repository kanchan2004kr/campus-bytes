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

export function loadEnv(): AppEnv {
  return {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: parseInt(process.env.PORT ?? '4000', 10),
    webOrigin: process.env.WEB_ORIGIN ?? 'http://localhost:3000',
    jwt: {
      accessSecret: process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret-change-me',
      refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret-change-me',
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
