import { Pool, QueryResultRow } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const query = <T extends QueryResultRow = any>(text: string, params?: any[]) => pool.query<T>(text, params);

export const getClient = () => pool.connect();
