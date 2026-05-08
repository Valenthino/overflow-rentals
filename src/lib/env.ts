export interface AppEnv {
  supabaseUrl: string;
  supabaseAnonKey: string;
  isConfigured: boolean;
  missing: string[];
}

function read(key: string): string {
  const v = process.env[key];
  return typeof v === 'string' ? v.trim() : '';
}

export function readEnv(): AppEnv {
  const supabaseUrl = read('EXPO_PUBLIC_SUPABASE_URL');
  const supabaseAnonKey = read('EXPO_PUBLIC_SUPABASE_ANON_KEY');

  const missing: string[] = [];
  if (!supabaseUrl || !/^https?:\/\//.test(supabaseUrl)) missing.push('EXPO_PUBLIC_SUPABASE_URL');
  if (!supabaseAnonKey || supabaseAnonKey.length < 20) missing.push('EXPO_PUBLIC_SUPABASE_ANON_KEY');

  return {
    supabaseUrl,
    supabaseAnonKey,
    isConfigured: missing.length === 0,
    missing,
  };
}

export const env = readEnv();
