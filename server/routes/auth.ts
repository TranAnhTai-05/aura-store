import { Router } from 'express';
import { row, run } from '../db/pool';
import { USER_SELECT, UserRow, toUser } from '../db/mappers';
import {
  endSession,
  getSessionLifetime,
  hashPassword,
  requireCustomer,
  resolveUser,
  startSession,
  verifyPassword,
  wastePasswordCheck,
} from '../auth';
import { badRequest, conflict, createRateLimiter, forbidden, newId, text, unauthorized } from '../http';
import { validatePassword, validateProfile, validateRegistration } from '../../shared/validators';
import { normalizePhone } from '../../shared/validation';
import { SHOP } from '../../shared/config';

export const authRouter = Router();

// 8 wrong passwords for the same account from the same address, then a 10 minute pause
export const loginLimiter = createRateLimiter(8, 10 * 60 * 1000);

const loadUser = (id: string) => row<UserRow>(`${USER_SELECT} WHERE u.id = ?`, [id]);

authRouter.get('/me', async (req, res) => {
  const session = await resolveUser(req, 'customer');
  const user = session ? await loadUser(session.id) : undefined;
  res.json({ user: user ? toUser(user) : null });
});

authRouter.post('/register', async (req, res) => {
  const input = {
    name: text(req.body?.name, 120),
    email: text(req.body?.email, 190).toLowerCase(),
    phone: text(req.body?.phone, 20),
    password: typeof req.body?.password === 'string' ? req.body.password : '',
  };
  const error = validateRegistration(input);
  if (error) throw badRequest(error);

  const existing = await row('SELECT id FROM users WHERE email = ?', [input.email]);
  if (existing) throw conflict('Email này đã có tài khoản. Vui lòng đăng nhập.');

  const id = newId('user');
  await run(
    'INSERT INTO users (id, name, email, phone, role, password_hash) VALUES (?, ?, ?, ?, ?, ?)',
    [id, input.name, input.email, normalizePhone(input.phone), 'customer', await hashPassword(input.password)]
  );

  const user = (await loadUser(id))!;
  startSession(res, 'customer', user, getSessionLifetime('customer'));
  res.status(201).json({ user: toUser(user) });
});

authRouter.post('/login', async (req, res) => {
  const email = text(req.body?.email, 190).toLowerCase();
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!email || !password) throw badRequest('Vui lòng nhập email và mật khẩu.');

  const key = `customer:${req.ip}:${email}`;
  loginLimiter.check(key);

  const account = await row<UserRow>('SELECT * FROM users WHERE email = ?', [email]);
  // Administrators sign in through the admin gate only. The answer is the same whether
  // the email is unknown or the password is wrong, so accounts cannot be probed.
  const isCustomer = !!account && account.role === 'customer';
  const matches = isCustomer
    ? await verifyPassword(password, account.password_hash)
    : await wastePasswordCheck(password);

  if (!isCustomer || !matches) {
    loginLimiter.fail(key);
    throw unauthorized('Email hoặc mật khẩu không đúng.');
  }
  if (account.is_locked) {
    throw forbidden(`Tài khoản đang bị tạm khóa. Vui lòng liên hệ hotline ${SHOP.hotline}.`);
  }

  loginLimiter.reset(key);
  startSession(res, 'customer', account, getSessionLifetime('customer'));
  res.json({ user: toUser((await loadUser(account.id))!) });
});

authRouter.post('/logout', (_req, res) => {
  endSession(res, 'customer');
  res.json({ ok: true });
});

authRouter.put('/profile', requireCustomer, async (req, res) => {
  const input = {
    name: text(req.body?.name, 120),
    phone: text(req.body?.phone, 20),
    address: text(req.body?.address, 255),
    city: text(req.body?.city, 80),
    district: text(req.body?.district, 80),
  };
  const error = validateProfile(input);
  if (error) throw badRequest(error);

  await run(
    'UPDATE users SET name = ?, phone = ?, address = ?, city = ?, district = ? WHERE id = ?',
    [input.name, normalizePhone(input.phone), input.address, input.city, input.district, req.user!.id]
  );
  res.json({ user: toUser((await loadUser(req.user!.id))!) });
});

authRouter.put('/password', requireCustomer, async (req, res) => {
  const current = typeof req.body?.currentPassword === 'string' ? req.body.currentPassword : '';
  const next = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';

  if (!(await verifyPassword(current, req.user!.password_hash))) {
    throw badRequest('Mật khẩu hiện tại không đúng.');
  }
  const error = validatePassword(next);
  if (error) throw badRequest(error);
  if (current === next) throw badRequest('Mật khẩu mới phải khác mật khẩu hiện tại.');

  // Raising the version signs out every other device; this one gets a fresh session
  await run('UPDATE users SET password_hash = ?, token_version = token_version + 1 WHERE id = ?', [
    await hashPassword(next),
    req.user!.id,
  ]);
  const user = (await loadUser(req.user!.id))!;
  startSession(res, 'customer', user, getSessionLifetime('customer'));
  res.json({ ok: true });
});
