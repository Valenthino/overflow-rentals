import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import type { Database } from '@/types/database';

let secureStore: typeof import('expo-secure-store') | null = null;

if (Platform.OS !== 'web') {
  secureStore = require('expo-secure-store');
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

const webStorage = Platform.OS === 'web' ? {
  getItem: (key: string) => {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(key);
  },
  setItem: (key: string, value: string) => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, value);
  },
  removeItem: (key: string) => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(key);
  },
} : undefined;

const nativeStorage = secureStore ? {
  getItem: (key: string) => secureStore!.getItemAsync(key),
  setItem: (key: string, value: string) => secureStore!.setItemAsync(key, value),
  removeItem: (key: string) => secureStore!.deleteItemAsync(key),
} : undefined;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: Platform.OS === 'web' ? webStorage : nativeStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});
