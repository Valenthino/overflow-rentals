export interface AppEnv {
  supabaseUrl: string;
  supabaseAnonKey: string;
  isConfigured: boolean;
  missing: string[];
}

// IMPORTANT: babel-preset-expo's env-inlining only rewrites STATIC member
// access (`process.env.EXPO_PUBLIC_FOO`). Dynamic access like
// `process.env[key]` is NOT inlined, which is why an earlier version of
// this file made the deployed web app think Supabase was unconfigured —
// the variable values never landed in the bundle. Keep these literal.
function trim(v: string | undefined): string {
  return typeof v === 'string' ? v.trim() : '';
}

export function readEnv(): AppEnv {
  const supabaseUrl = trim(process.env.EXPO_PUBLIC_SUPABASE_URL);
  const supabaseAnonKey = trim(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

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
