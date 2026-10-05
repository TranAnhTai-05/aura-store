/**
 * Starts the API server and the storefront together (npm run dev).
 * Both are started with `node` directly rather than through npm's command shims,
 * which break on Windows when the project folder name contains "&".
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bin = (...parts) => path.join(root, 'node_modules', ...parts);

const processes = [
  {
    name: 'api',
    color: '\x1b[36m',
    args: [bin('tsx', 'dist', 'cli.mjs'), 'watch', '--clear-screen=false', 'server/index.ts'],
  },
  {
    name: 'web',
    color: '\x1b[35m',
    args: [bin('vite', 'bin', 'vite.js'), '--port=3000', '--host=0.0.0.0'],
  },
];

const children = processes.map(({ name, color, args }) => {
  const child = spawn(process.execPath, args, { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
  const prefix = `${color}[${name}]\x1b[0m `;
  const forward = (stream, target) => {
    let pending = '';
    stream.on('data', (chunk) => {
      const lines = (pending + chunk).split(/\r?\n/);
      pending = lines.pop();
      for (const line of lines) target.write(`${prefix}${line}\n`);
    });
  };
  forward(child.stdout, process.stdout);
  forward(child.stderr, process.stderr);
  child.on('exit', (code) => {
    // One of the two stopping ends the session, so nothing is left half running
    if (!stopping) {
      console.log(`${prefix}đã dừng (mã ${code}).`);
      stop(code ?? 1);
    }
  });
  return child;
});

let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) if (!child.killed) child.kill();
  setTimeout(() => process.exit(code), 300);
}

process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));
