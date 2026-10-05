import { config } from './config';
import { connect, disconnect } from './db/pool';
import { migrate } from './db/schema';
import { isDatabaseEmpty, seed } from './db/seed';
import { createApp } from './app';

const CONNECT_ATTEMPTS = 10;
const CONNECT_PAUSE_MS = 3000;

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** A wrong password will not fix itself; a database that is still starting up will */
const isWorthRetrying = (code?: string) =>
  code !== 'ER_ACCESS_DENIED_ERROR' && code !== 'ER_DBACCESS_DENIED_ERROR';

/**
 * Connects and prepares the tables. MySQL often needs a few seconds after
 * "docker compose up", so the first failures are waited out.
 */
async function prepareDatabase() {
  for (let attempt = 1; ; attempt++) {
    try {
      await connect();
      await migrate();
      if (await isDatabaseEmpty()) {
        await seed();
        console.log('[api] Cơ sở dữ liệu trống: đã nạp dữ liệu mẫu.');
      }
      return;
    } catch (error) {
      const code = (error as { code?: string }).code;
      await disconnect().catch(() => {});

      if (attempt >= CONNECT_ATTEMPTS || !isWorthRetrying(code)) {
        console.error(`\n[api] Không chuẩn bị được MySQL tại ${config.db.host}:${config.db.port} (${code ?? error}).`);
        console.error('      Kiểm tra rằng MySQL đang chạy và thông tin trong tệp .env là đúng.');
        console.error('      Dùng Docker: chạy "docker compose up -d" rồi thử lại.\n');
        process.exit(1);
      }
      console.log(
        `[api] MySQL chưa sẵn sàng (${code ?? 'lỗi kết nối'}), thử lại lần ${attempt + 1}/${CONNECT_ATTEMPTS}...`
      );
      await pause(CONNECT_PAUSE_MS);
    }
  }
}

async function main() {
  await prepareDatabase();

  // Express passes a failure to listen (e.g. the port is taken) to this same callback
  const server = createApp().listen(config.port, (error?: Error) => {
    if (error) {
      if ((error as NodeJS.ErrnoException).code === 'EADDRINUSE') {
        console.error(`[api] Cổng ${config.port} đang được dùng. Đổi API_PORT trong tệp .env.`);
      } else {
        console.error('[api] Không mở được cổng:', error);
      }
      process.exit(1);
    }
    console.log(
      `[api] Đang chạy tại http://localhost:${config.port} · MySQL ${config.db.host}:${config.db.port}/${config.db.database}`
    );
  });

  const shutdown = () => {
    server.close(async () => {
      await disconnect();
      process.exit(0);
    });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error) => {
  console.error('[api] Không khởi động được máy chủ:', error);
  process.exit(1);
});
