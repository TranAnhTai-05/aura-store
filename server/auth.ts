import type { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from './config';
import { row } from './db/pool';
import { UserRow } from './db/mappers';
import { forbidden, unauthorized } from './http';
import { SHOP } from '../shared/config';

export const BCRYPT_ROUNDS = 10;

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

type Audience = 'customer' | 'admin';

/** Customers and administrators have separate sessions that never stand in for each other */
const COOKIES: Record<Audience, string> = {
  customer: 'aura_session',
  admin: 'aura_admin_session',
};

type TokenPayload = { sub: string; ver: number; aud: Audience };

export const hashPassword = (password: string) => bcrypt.hash(password, BCRYPT_ROUNDS);
export const verifyPassword = (password: string, hash: string) => bcrypt.compare(password, hash);

// Compared against when the account does not exist, so that both cases take equally long
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', BCRYPT_ROUNDS);
export const wastePasswordCheck = (password: string) => bcrypt.compare(password, DUMMY_HASH);

export function getSessionLifetime(audience: Audience, remember = false): number {
  if (audience === 'customer') return SHOP.customerSessionDays * DAY_MS;
  return remember ? SHOP.adminRememberDays * DAY_MS : SHOP.adminSessionHours * HOUR_MS;
}

export function startSession(
  res: Response,
  audience: Audience,
  user: Pick<UserRow, 'id' | 'token_version'>,
  lifetimeMs: number
) {
  const payload: TokenPayload = { sub: user.id, ver: user.token_version, aud: audience };
  const token = jwt.sign(payload, config.jwtSecret, {
    algorithm: 'HS256',
    expiresIn: Math.floor(lifetimeMs / 1000),
  });
  res.cookie(COOKIES[audience], token, {
    // Out of reach of page scripts, so a script injection cannot steal the session
    httpOnly: true,
    sameSite: 'lax',
    secure: config.cookieSecure,
    maxAge: lifetimeMs,
    path: '/',
  });
}

export function endSession(res: Response, audience: Audience) {
  res.clearCookie(COOKIES[audience], {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.cookieSecure,
    path: '/',
  });
}

/** The account behind the request's session, or null when there is no valid session */
export async function resolveUser(req: Request, audience: Audience): Promise<UserRow | null> {
  const token = req.cookies?.[COOKIES[audience]];
  if (typeof token !== 'string' || !token) return null;

  let payload: TokenPayload;
  try {
    payload = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] }) as TokenPayload;
  } catch {
    return null; // expired or tampered with
  }
  if (payload.aud !== audience) return null;

  // Checked against the database on every request: a locked account or a changed
  // password ends the session at once instead of when the token runs out
  const user = await row<UserRow>('SELECT * FROM users WHERE id = ?', [payload.sub]);
  if (!user || user.role !== audience) return null;
  if (user.token_version !== payload.ver || user.is_locked) return null;
  return user;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: UserRow;
  }
}

export async function requireCustomer(req: Request, _res: Response, next: NextFunction) {
  const user = await resolveUser(req, 'customer');
  if (!user) return next(unauthorized('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'));
  req.user = user;
  next();
}

export async function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  const user = await resolveUser(req, 'admin');
  if (!user) {
    // A signed-in customer gets a clear "no", everyone else is asked to sign in
    const customer = await resolveUser(req, 'customer');
    return next(
      customer ? forbidden() : unauthorized('Phiên quản trị đã hết hạn. Vui lòng đăng nhập lại.')
    );
  }
  req.user = user;
  next();
}
