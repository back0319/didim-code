import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { Pool } from '@neondatabase/serverless';

const migrationsDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../db/migrations');
const connectionString = process.env.MIGRATION_DATABASE_URL;

if (!connectionString) {
  throw new Error('스키마 소유자 연결 문자열 MIGRATION_DATABASE_URL가 필요합니다.');
}

const pool = new Pool({ connectionString });
const client = await pool.connect();

try {
  await client.query(`
    create table if not exists public.schema_migrations (
      version text primary key,
      applied_at timestamptz not null default now()
    )
  `);
  const { rows } = await client.query('select version from public.schema_migrations');
  const applied = new Set(rows.map((row) => row.version));

  const files = readdirSync(migrationsDirectory).filter((file) => file.endsWith('.sql')).sort();
  for (const file of files) {
    const version = file.split('_')[0];
    if (applied.has(version)) continue;

    await client.query('begin');
    try {
      await client.query(readFileSync(path.join(migrationsDirectory, file), 'utf8'));
      await client.query('insert into public.schema_migrations (version) values ($1)', [version]);
      await client.query('commit');
      console.log(`Applied ${file}`);
    } catch (error) {
      await client.query('rollback');
      throw new Error(`${file} 적용에 실패했습니다.`, { cause: error });
    }
  }
} finally {
  client.release();
  await pool.end();
}
