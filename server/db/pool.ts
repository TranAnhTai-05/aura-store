import mysql, { Pool, PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { config } from '../config';

let pool: Pool | null = null;

const connectionOptions = {
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  charset: 'utf8mb4',
  // Timestamps are stored and read as UTC; the browser formats them for the viewer
  timezone: 'Z',
  // DATE columns (e.g. a promotion's last day) stay 'YYYY-MM-DD' instead of becoming a moment in time
  dateStrings: ['DATE'] as ('DATE' | 'DATETIME' | 'TIMESTAMP')[],
  // SUM() and AVG() come back as numbers, not strings
  decimalNumbers: true,
};

/** Creates the database when the account is allowed to; otherwise it has to exist already */
async function ensureDatabase(): Promise<void> {
  const connection = await mysql.createConnection(connectionOptions);
  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${config.db.database.replace(/`/g, '')}\`
       CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
  } catch (error) {
    const code = (error as { code?: string }).code;
    // A restricted account cannot create databases; that is fine if the database is there
    if (code !== 'ER_DBACCESS_DENIED_ERROR' && code !== 'ER_ACCESS_DENIED_ERROR') throw error;
  } finally {
    await connection.end();
  }
}

export async function connect(): Promise<Pool> {
  if (pool) return pool;
  await ensureDatabase();
  pool = mysql.createPool({
    ...connectionOptions,
    database: config.db.database,
    connectionLimit: 10,
    waitForConnections: true,
    namedPlaceholders: false,
  });
  await pool.query('SELECT 1');
  return pool;
}

export function getPool(): Pool {
  if (!pool) throw new Error('Database pool is not connected yet.');
  return pool;
}

export async function disconnect(): Promise<void> {
  await pool?.end();
  pool = null;
}

type Params = (string | number | boolean | null | Date)[];
type Executor = Pool | PoolConnection;

export async function rows<T = RowDataPacket>(
  sql: string,
  params: Params = [],
  executor: Executor = getPool()
): Promise<T[]> {
  const [result] = await executor.query<RowDataPacket[]>(sql, params);
  return result as T[];
}

export async function row<T = RowDataPacket>(
  sql: string,
  params: Params = [],
  executor: Executor = getPool()
): Promise<T | undefined> {
  return (await rows<T>(sql, params, executor))[0];
}

export async function run(
  sql: string,
  params: Params = [],
  executor: Executor = getPool()
): Promise<ResultSetHeader> {
  const [result] = await executor.query<ResultSetHeader>(sql, params);
  return result;
}

/** Runs `work` in a transaction: everything it does is kept, or nothing is */
export async function transaction<T>(work: (connection: PoolConnection) => Promise<T>): Promise<T> {
  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
