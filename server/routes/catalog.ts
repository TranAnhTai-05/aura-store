import { Router } from 'express';
import { row, run } from '../db/pool';
import { loadCategories, loadProducts, loadPromotions, loadReviews } from '../db/mappers';
import { conflict, newId, text } from '../http';
import { validateContact } from '../../shared/validators';
import { EMAIL_HINT, isValidEmail } from '../../shared/validation';
import { badRequest } from '../http';

export const catalogRouter = Router();

/** Everything the storefront needs to render: one request when the shop is opened */
catalogRouter.get('/catalog', async (_req, res) => {
  const [products, categories, promotions, reviews] = await Promise.all([
    loadProducts(true),
    loadCategories(),
    loadPromotions(),
    loadReviews(),
  ]);
  const visible = new Set(products.map((p) => p.id));
  res.json({
    products,
    categories,
    // Paused codes are of no use to customers
    promotions: promotions.filter((p) => p.isActive),
    reviews: reviews.filter((r) => visible.has(r.productId)),
  });
});

catalogRouter.post('/contact', async (req, res) => {
  const input = {
    name: text(req.body?.name, 120),
    email: text(req.body?.email, 190),
    message: typeof req.body?.message === 'string' ? req.body.message.trim() : '',
  };
  const error = validateContact(input);
  if (error) throw badRequest(error);

  await run('INSERT INTO contact_messages (id, name, email, message) VALUES (?, ?, ?, ?)', [
    newId('msg'),
    input.name,
    input.email,
    input.message,
  ]);
  res.status(201).json({ ok: true });
});

catalogRouter.post('/newsletter', async (req, res) => {
  const email = text(req.body?.email, 190).toLowerCase();
  if (!isValidEmail(email)) throw badRequest(EMAIL_HINT);

  const existing = await row('SELECT email FROM newsletter_subscribers WHERE email = ?', [email]);
  if (existing) throw conflict('Email này đã đăng ký nhận bản tin.');

  await run('INSERT INTO newsletter_subscribers (email) VALUES (?)', [email]);
  res.status(201).json({ ok: true });
});
