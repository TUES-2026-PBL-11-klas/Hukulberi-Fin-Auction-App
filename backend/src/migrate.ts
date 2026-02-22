import fs from 'fs';
import path from 'path';
import { query } from './db';

export const runMigrations = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      filename TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

  const result = await query<{ filename: string }>('SELECT filename FROM _migrations');
  const applied = result.rows;
  const appliedSet = new Set(applied.map(r => r.filename));

  for (const file of files) {
    if (appliedSet.has(file)) {
      console.log(`Migration already applied, skipping: ${file}`);
      continue;
    }

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    try {
      await query(sql);
      await query('INSERT INTO _migrations (filename) VALUES ($1)', [file]);
      console.log(`Migration applied: ${file}`);
    } catch (err) {
      console.error(`Error applying migration ${file}:`, err);
      throw err;
    }
  }
};
