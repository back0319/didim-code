import { createClient, SupabaseClient } from '@supabase/supabase-js';

let publicClient: SupabaseClient | null = null;
let adminClient: SupabaseClient | null = null;

function requiredEnvironmentVariable(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`필수 환경변수 ${name}가 설정되지 않았습니다.`);
  }
  return value;
}

export function getPublicSupabaseClient(): SupabaseClient {
  if (!publicClient) {
    publicClient = createClient(
      requiredEnvironmentVariable('NEXT_PUBLIC_SUPABASE_URL'),
      requiredEnvironmentVariable('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'),
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      },
    );
  }
  return publicClient;
}

export function getAdminSupabaseClient(): SupabaseClient {
  if (!adminClient) {
    adminClient = createClient(
      requiredEnvironmentVariable('NEXT_PUBLIC_SUPABASE_URL'),
      requiredEnvironmentVariable('SUPABASE_SECRET_KEY'),
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      },
    );
  }
  return adminClient;
}
