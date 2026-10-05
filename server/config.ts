import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const here = path.dirname(fileURLToPath(import.meta.url));
export const ROOT_DIR = path.resolve(here, '..');

dotenv.config({ path: path.join(ROOT_DIR, '.env'), quiet: true });

function required(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === '') {
    throw new Error(
      `Thiếu biến môi trường ${name}. Hãy sao chép .env.example thành .env và điền giá trị.`
    );
  }
  return value;
}

const isProduction = process.env.NODE_ENV === 'production';

const jwtSecret = required('JWT_SECRET');
if (jwtSecret === 'change-me' || jwtSecret.length < 32) {
  throw new Error('JWT_SECRET phải là chuỗi ngẫu nhiên dài ít nhất 32 ký tự (xem .env.example).');
}

export const config = {
  isProduction,
  // API_PORT wins over PORT: many tools set PORT for the web server they start, and in
  // development that is the storefront, not this API. Hosting platforms that run only
  // this server set PORT and no API_PORT.
  port: Number(process.env.API_PORT) || Number(process.env.PORT) || 4000,
  jwtSecret,
  // Session cookies are sent over HTTPS only in production. COOKIE_SECURE=false allows
  // a production build to be tried out over plain http on a local network.
  cookieSecure: process.env.COOKIE_SECURE
    ? process.env.COOKIE_SECURE !== 'false'
    : isProduction,
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: required('DB_USER'),
    // XAMPP ships with an empty root password, so empty is allowed here
    password: process.env.DB_PASSWORD ?? '',
    database: required('DB_NAME'),
    // Hosted MySQL (Aiven…) requires TLS. DB_SSL_CA is the provider's CA certificate (PEM);
    // without it the system's trusted authorities are used.
    ssl:
      process.env.DB_SSL === 'true'
        ? { rejectUnauthorized: true, ca: process.env.DB_SSL_CA?.replace(/\\n/g, '\n') || undefined }
        : undefined,
  },
  // Which proxies may report the visitor's IP (used to rate-limit logins). Hosting platforms
  // put one proxy in front of the app: TRUST_PROXY=1. Default: only a proxy on this machine.
  trustProxy: /^\d+$/.test(process.env.TRUST_PROXY ?? '')
    ? Number(process.env.TRUST_PROXY)
    : process.env.TRUST_PROXY || 'loopback',
  uploadsDir: path.join(ROOT_DIR, 'server', 'uploads'),
  clientDir: path.join(ROOT_DIR, 'dist'),
};
