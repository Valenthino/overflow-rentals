import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import type { Database } from '@/types/database';
import { env } from '@/lib/env';

let secureStore: typeof import('expo-secure-store') | null = null;
if (Platform.OS !== 'web') {
  try {
    secureStore = require('expo-secure-store');
  } catch (e) {
    if (__DEV__) {
      console.warn('[supabase] expo-secure-store unavailable; falling back to in-memory storage', e);
    }
  }
}

const memoryStore = new Map<string, string>();

const inMemoryStorage = {
  getItem: async (key: string) => memoryStore.get(key) ?? null,
  setItem: async (key: string, value: string) => {
    memoryStore.set(key, value);
  },
  removeItem: async (key: string) => {
    memoryStore.delete(key);
  },
};

const webStorage =
  Platform.OS === 'web'
    ? {
        getItem: (key: string) => {
          if (typeof window === 'undefined') return null;
          try {
            return window.localStorage.getItem(key);
          } catch {
            return null;
          }
        },
        setItem: (key: string, value: string) => {
          if (typeof window === 'undefined') return;
          try {
            window.localStorage.setItem(key, value);
          } catch {
            // ignore
          }
        },
        removeItem: (key: string) => {
          if (typeof window === 'undefined') return;
          try {
            window.localStorage.removeItem(key);
          } catch {
            // ignore
          }
        },
      }
    : undefined;

const nativeStorage = secureStore
  ? {
      getItem: (key: string) => secureStore!.getItemAsync(key),
      setItem: (key: string, value: string) => secureStore!.setItemAsync(key, value),
      removeItem: (key: string) => secureStore!.deleteItemAsync(key),
    }
  : inMemoryStorage;

function makeStubClient(): SupabaseClient<Database> {
  const error = new Error(
    `Supabase is not configured. Missing: ${env.missing.join(', ')}. ` +
      'Add them to your .env file (see .env.example) or your EAS build profile.',
  );
  const reject = async () => ({ data: null, error });
  const handler: ProxyHandler<any> = {
    get(_target, prop) {
      if (prop === 'auth') {
        return {
          getSession: async () => ({ data: { session: null }, error }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
          signInWithPassword: reject,
          signUp: reject,
          signOut: async () => ({ error }),
          resetPasswordForEmail: reject,
        };
      }
      if (prop === 'from') {
        return () =>
          new Proxy({}, {
            get: () => () => ({ data: [], error }),
          });
      }
      return () => undefined;
    },
  };
  return new Proxy({}, handler) as SupabaseClient<Database>;
}

export const supabase: SupabaseClient<Database> = env.isConfigured
  ? createClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
      auth: {
        storage: Platform.OS === 'web' ? webStorage : nativeStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: Platform.OS === 'web',
      },
    })
  : makeStubClient();

export const isSupabaseConfigured = env.isConfigured;
export const missingEnvVars = env.missing;
