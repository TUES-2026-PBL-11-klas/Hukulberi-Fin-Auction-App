import fs from 'fs';
import path from 'path';
import { query } from './db';

export const runMigrations = async () => {
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    try {
      await query(sql);
      console.log(`Migration applied: ${file}`);
    } catch (err) {
      console.error(`Error applying migration ${file}:`, err);
      throw err;
    }
  }
};
