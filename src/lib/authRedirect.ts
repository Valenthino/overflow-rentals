import { Platform } from 'react-native';

/**
 * Where Supabase should send the user after email confirmation / password
 * reset. On web this is the current origin, so it works in local dev
 * (http://localhost:8081) and on the deployed site (https://ovf.expo.app)
 * without hardcoding anything. On native it's the app's deep-link scheme.
 *
 * NOTE: the resolved URL must be in the Supabase Auth "Redirect URLs" allow
 * list, and the project's Site URL should be set to the production web origin.
 * Otherwise Supabase ignores this and falls back to the Site URL — whose
 * default is http://localhost:3000.
 */
export function getAuthRedirectUrl(): string | undefined {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location?.origin) {
      return window.location.origin;
    }
    return undefined;
  }
  return 'overflow-rentals://';
}
