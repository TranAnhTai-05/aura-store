import { config } from './config';
import { connect, disconnect } from './db/pool';
import { migrate } from './db/schema';
import { isDatabaseEmpty, seed } from './db/seed';
import { createApp } from './app';

const CONNECT_ATTEMPTS = 10;
const CONNECT_PAUSE_MS = 3000;

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Invalid credentials will not fix themselves; a database that is still starting up will. */
const isWorthRetrying = (code?: string) =>
  code !== 'ELOGIN' && code !== 'EINVALID';

/**
 * Connects and prepares the tables. Hosted SQL Server instances can take a few
 * seconds to accept connections after waking up, so transient failures are retried.
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
        console.error(`\n[api] Không chuẩn bị được SQL Server tại ${config.db.host}:${config.db.port} (${code ?? error}).`);
        console.error('      Kiểm tra host, port, user, password, database và tùy chọn mã hóa trong .env.\n');
        process.exit(1);
      }
      console.log(
        `[api] SQL Server chưa sẵn sàng (${code ?? 'lỗi kết nối'}), thử lại lần ${attempt + 1}/${CONNECT_ATTEMPTS}...`
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
      `[api] Đang chạy tại http://localhost:${config.port} · SQL Server ${config.db.host}:${config.db.port}/${config.db.database}`
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
