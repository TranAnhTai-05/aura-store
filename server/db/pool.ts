import sql from 'mssql';
import type { ConnectionPool, Transaction } from 'mssql';
import { config } from '../config';

export type DbValue = string | number | boolean | null | Date;
export type DbRow = Record<string, unknown>;
export type DbResult = {
  recordset: DbRow[];
  rowsAffected: number[];
  affectedRows: number;
  insertId: number;
};

type RequestSource = ConnectionPool | Transaction;

export class DbExecutor {
  constructor(private readonly source: RequestSource) {}

  async query<T extends DbRow = DbRow>(
    statement: string,
    params: DbValue[] = []
  ): Promise<[DbResult]> {
    const request = this.source.request();
    params.forEach((value, index) => request.input(`p${index}`, value));

    let parameter = 0;
    const query = statement.replace(/'(?:''|[^'])*'|"(?:\"\"|[^"])*"|\?/g, (token) =>
      token === '?' ? `@p${parameter++}` : token
    );
    const result = await request.query<T>(query);
    const recordset = (result.recordset ?? []) as DbRow[];
    const rowsAffected = result.rowsAffected ?? [];
    return [
      {
        recordset,
        rowsAffected,
        affectedRows: rowsAffected.reduce((total, count) => total + count, 0),
        insertId: Number(recordset[0]?.insertId ?? 0),
      },
    ];
  }
}

export type PoolConnection = DbExecutor;
export type Pool = DbExecutor;
type Params = DbValue[];

let connectionPool: ConnectionPool | null = null;
let pool: Pool | null = null;

export async function connect(): Promise<Pool> {
  if (pool) return pool;

  connectionPool = new sql.ConnectionPool({
    server: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    connectionTimeout: 30_000,
    requestTimeout: 30_000,
    pool: { max: 10, min: 0, idleTimeoutMillis: 30_000 },
    options: {
      encrypt: config.db.encrypt,
      trustServerCertificate: config.db.trustServerCertificate,
      enableArithAbort: true,
    },
  });
  await connectionPool.connect();
  pool = new DbExecutor(connectionPool);
  await pool.query('SELECT 1');
  return pool;
}

export function getPool(): Pool {
  if (!pool) throw new Error('Database pool is not connected yet.');
  return pool;
}

export async function disconnect(): Promise<void> {
  const current = connectionPool;
  connectionPool = null;
  pool = null;
  if (current?.connected) await current.close();
}

export async function rows<T extends DbRow = DbRow>(
  statement: string,
  params: Params = [],
  executor: PoolConnection = getPool()
): Promise<T[]> {
  const [result] = await executor.query(statement, params);
  return result.recordset as T[];
}

export async function row<T extends DbRow = DbRow>(
  statement: string,
  params: Params = [],
  executor: PoolConnection = getPool()
): Promise<T | undefined> {
  return (await rows<T>(statement, params, executor))[0];
}

export async function run(
  statement: string,
  params: Params = [],
  executor: PoolConnection = getPool()
): Promise<DbResult> {
  const [result] = await executor.query(statement, params);
  return result;
}

/** Runs `work` in a transaction: everything it does is kept, or nothing is. */
export async function transaction<T>(work: (connection: PoolConnection) => Promise<T>): Promise<T> {
  if (!connectionPool) throw new Error('Database pool is not connected yet.');
  const transaction = new sql.Transaction(connectionPool);
  await transaction.begin(sql.ISOLATION_LEVEL.READ_COMMITTED);
  try {
    const result = await work(new DbExecutor(transaction));
    await transaction.commit();
    return result;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export function isDuplicateKeyError(error: unknown): boolean {
  const code = (error as { number?: number; code?: string }).number;
  const name = (error as { code?: string }).code;
  return code === 2601 || code === 2627 || name === 'EREQUEST_DUPLICATE';
}
