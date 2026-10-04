import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

let sql: NeonQueryFunction<false, false> | null = null;

export function getSql(): NeonQueryFunction<false, false> {
  if (!sql) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('필수 환경변수 DATABASE_URL가 설정되지 않았습니다.');
    }
    sql = neon(connectionString);
  }
  return sql;
}
