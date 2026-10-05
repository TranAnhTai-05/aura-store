import { Router } from 'express';
import { rows, transaction } from '../db/pool';
import { requireCustomer } from '../auth';
import { badRequest, text } from '../http';
import { CartLine } from '../../shared/types';

export const cartRouter = Router();

cartRouter.use(requireCustomer);

const MAX_LINES = 50;

type CartRow = {
  product_id: string;
  selected_color: string;
  selected_capacity: string;
  quantity: number;
};

async function loadCart(userId: string): Promise<CartLine[]> {
  const found = await rows<CartRow>(
    'SELECT * FROM cart_items WHERE user_id = ? ORDER BY position',
    [userId]
  );
  return found.map((r) => ({
    productId: r.product_id,
    quantity: r.quantity,
    selectedColor: r.selected_color || undefined,
    selectedCapacity: r.selected_capacity || undefined,
  }));
}

/** Reads cart lines sent by a browser, dropping anything that is not a well-formed line */
export function parseCartLines(value: unknown): CartLine[] {
  if (!Array.isArray(value)) throw badRequest('Giỏ hàng không hợp lệ.');
  if (value.length > MAX_LINES) throw badRequest(`Giỏ hàng có tối đa ${MAX_LINES} dòng.`);

  const merged = new Map<string, CartLine>();
  for (const entry of value) {
    const productId = text(entry?.productId, 40);
    const quantity = Math.floor(Number(entry?.quantity));
    if (!productId || !Number.isFinite(quantity) || quantity < 1) continue;

    const line: CartLine = {
      productId,
      quantity: Math.min(quantity, 9999),
      selectedColor: text(entry?.selectedColor, 80) || undefined,
      selectedCapacity: text(entry?.selectedCapacity, 80) || undefined,
    };
    const key = [line.productId, line.selectedColor ?? '', line.selectedCapacity ?? ''].join('::');
    const existing = merged.get(key);
    if (existing) existing.quantity = Math.min(existing.quantity + line.quantity, 9999);
    else merged.set(key, line);
  }
  return [...merged.values()];
}

cartRouter.get('/', async (req, res) => {
  res.json({ lines: await loadCart(req.user!.id) });
});

/** The browser owns the cart while it is open and saves the whole cart after each change */
cartRouter.put('/', async (req, res) => {
  const lines = parseCartLines(req.body?.lines);
  const userId = req.user!.id;

  await transaction(async (db) => {
    await db.query('DELETE FROM cart_items WHERE user_id = ?', [userId]);
    if (lines.length === 0) return;

    // Lines of products that no longer exist are left out instead of failing the save
    const ids = [...new Set(lines.map((l) => l.productId))];
    const known = await rows<{ id: string }>(
      `SELECT id FROM products WHERE id IN (${ids.map(() => '?').join(', ')})`,
      ids,
      db
    );
    const exists = new Set(known.map((p) => p.id));

    let position = 0;
    for (const line of lines) {
      if (!exists.has(line.productId)) continue;
      await db.query(
        `INSERT INTO cart_items (user_id, product_id, selected_color, selected_capacity, quantity, position)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          userId,
          line.productId,
          line.selectedColor ?? '',
          line.selectedCapacity ?? '',
          line.quantity,
          position++,
        ]
      );
    }
  });

  res.json({ lines: await loadCart(userId) });
});
