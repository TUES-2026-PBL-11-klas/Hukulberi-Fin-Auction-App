import { Pool } from 'pg';

let pool: Pool;

export const getPool = (): Pool => {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
  }
  return pool;
};

export default { query: (...args: Parameters<Pool['query']>) => getPool().query(...args) };
