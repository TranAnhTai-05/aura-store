import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import cookieParser from 'cookie-parser';
import { config } from './config';
import { errorHandler, notFound, requireClientHeader } from './http';
import { catalogRouter } from './routes/catalog';
import { authRouter } from './routes/auth';
import { cartRouter } from './routes/cart';
import { ordersRouter, reviewsRouter } from './routes/orders';
import { adminRouter } from './routes/admin';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  // Behind the Vite proxy in development and a reverse proxy in production
  app.set('trust proxy', 'loopback');

  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  app.use(express.json({ limit: '200kb' }));
  app.use(cookieParser());

  // Uploaded product photos. Only files this server named itself live here.
  app.use(
    '/uploads',
    express.static(config.uploadsDir, { maxAge: '7d', index: false, dotfiles: 'deny' })
  );

  const api = express.Router();
  api.use((_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });
  api.use(requireClientHeader);

  api.get('/health', (_req, res) => res.json({ ok: true }));
  api.use(catalogRouter);
  api.use('/auth', authRouter);
  api.use('/cart', cartRouter);
  api.use('/orders', ordersRouter);
  api.use('/reviews', reviewsRouter);
  api.use('/admin', adminRouter);
  api.use((_req, _res, next) => next(notFound('Không tìm thấy địa chỉ API này.')));

  app.use('/api', api);

  // In production this server also serves the built storefront
  if (fs.existsSync(path.join(config.clientDir, 'index.html'))) {
    app.use(express.static(config.clientDir, { index: false, maxAge: '1h' }));
    app.get(/^(?!\/api\/|\/uploads\/).*/, (_req, res) => {
      res.sendFile(path.join(config.clientDir, 'index.html'));
    });
  }

  app.use(errorHandler);
  return app;
}
