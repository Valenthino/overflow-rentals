export interface AppEnv {
  supabaseUrl: string;
  supabaseAnonKey: string;
  isConfigured: boolean;
  missing: string[];
}

function clean(v: string | undefined): string {
  return typeof v === 'string' ? v.trim() : '';
}

export function readEnv(): AppEnv {
  // IMPORTANT: Metro inlines EXPO_PUBLIC_* vars at build time ONLY via *static*
  // member access (process.env.EXPO_PUBLIC_FOO). A dynamic lookup such as
  // process.env[key] is never inlined and resolves to undefined in the shipped
  // bundle (web and native), so each variable must be referenced literally.
  const supabaseUrl = clean(process.env.EXPO_PUBLIC_SUPABASE_URL);
  const supabaseAnonKey = clean(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

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
