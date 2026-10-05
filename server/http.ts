import type { NextFunction, Request, Response } from 'express';

/** An error that is meant to be shown to the person using the shop */
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

export const badRequest = (message: string) => new HttpError(400, message);
export const unauthorized = (message = 'Vui lòng đăng nhập.') => new HttpError(401, message);
export const forbidden = (message = 'Bạn không có quyền thực hiện thao tác này.') =>
  new HttpError(403, message);
export const notFound = (message = 'Không tìm thấy dữ liệu.') => new HttpError(404, message);
export const conflict = (message: string) => new HttpError(409, message);

/** Text fields arrive as anything; this turns them into a trimmed string of bounded length */
export function text(value: unknown, maxLength = 255): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

export function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Browsers cannot add a custom header to a cross-site form post or image request, so
 * requiring one on every change keeps other websites from acting with the visitor's session.
 */
export function requireClientHeader(req: Request, _res: Response, next: NextFunction) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  if (req.get('X-Aura-Client') !== 'web') return next(forbidden('Yêu cầu không hợp lệ.'));
  next();
}

type Attempt = { count: number; resetAt: number };

/** Slows down password guessing: a few attempts per key, then a pause */
export function createRateLimiter(limit: number, windowMs: number) {
  const attempts = new Map<string, Attempt>();

  const sweep = setInterval(() => {
    const now = Date.now();
    attempts.forEach((attempt, key) => {
      if (attempt.resetAt <= now) attempts.delete(key);
    });
  }, windowMs);
  sweep.unref();

  return {
    /** Throws when the key has used up its attempts */
    check(key: string) {
      const attempt = attempts.get(key);
      if (attempt && attempt.resetAt > Date.now() && attempt.count >= limit) {
        const minutes = Math.ceil((attempt.resetAt - Date.now()) / 60000);
        throw new HttpError(
          429,
          `Bạn đã thử quá nhiều lần. Vui lòng thử lại sau ${minutes} phút.`
        );
      }
    },
    fail(key: string) {
      const now = Date.now();
      const attempt = attempts.get(key);
      if (!attempt || attempt.resetAt <= now) {
        attempts.set(key, { count: 1, resetAt: now + windowMs });
      } else {
        attempt.count += 1;
      }
    },
    reset(key: string) {
      attempts.delete(key);
    },
  };
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: error.message });
    return;
  }

  const known = error as { type?: string; code?: string; status?: number };
  if (known.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'Dữ liệu gửi lên không hợp lệ.' });
    return;
  }
  if (known.type === 'entity.too.large' || known.code === 'LIMIT_FILE_SIZE') {
    res.status(413).json({ error: 'Dữ liệu gửi lên quá lớn.' });
    return;
  }

  // Details stay in the server log; the visitor only learns that something went wrong
  console.error('[api] Unhandled error:', error);
  res.status(500).json({ error: 'Máy chủ gặp sự cố. Vui lòng thử lại sau.' });
}
