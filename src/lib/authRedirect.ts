import { Platform } from 'react-native';
import type { EmailOtpType, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

/**
 * Where Supabase should send the user after email confirmation / password
 * reset. On web this is the current origin, so it works in local dev
 * (http://localhost:8081) and on the deployed app (https://app.ovfleet.com)
 * without hardcoding anything. On native it's the app's deep-link scheme.
 *
 * NOTE: the resolved URL must be in the Supabase Auth "Redirect URLs" allow
 * list, and the project's Site URL should be set to the production web origin
 * (https://app.ovfleet.com). Otherwise Supabase ignores this and falls back to
 * the Site URL. See docs/DEPLOYMENT.md for the exact values to configure.
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

/** Auth params can arrive in the query string or the URL fragment. */
function extractAuthParams(url: string): Record<string, string> {
  const params: Record<string, string> = {};
  const collect = (segment: string | undefined) => {
    if (!segment) return;
    for (const pair of segment.replace(/^[?#]/, '').split('&')) {
      if (!pair) continue;
      const eq = pair.indexOf('=');
      const key = eq === -1 ? pair : pair.slice(0, eq);
      const value = eq === -1 ? '' : pair.slice(eq + 1);
      if (key) {
        try {
          params[decodeURIComponent(key)] = decodeURIComponent(value);
        } catch {
          params[key] = value;
        }
      }
    }
  };

  const hashIndex = url.indexOf('#');
  const queryIndex = url.indexOf('?');
  if (queryIndex !== -1) {
    collect(url.slice(queryIndex + 1, hashIndex > queryIndex ? hashIndex : undefined));
  }
  if (hashIndex !== -1) {
    collect(url.slice(hashIndex + 1));
  }
  return params;
}

export interface DeepLinkAuthResult {
  session: Session | null;
  /** The Supabase link type when present, e.g. "signup" | "recovery" | "magiclink". */
  type?: string;
}

/**
 * Establishes a Supabase session from a deep link opened on native after the
 * user taps an email confirmation / magic / password-reset link.
 *
 * Handles every shape Supabase may use:
 *  - PKCE:      ?code=...                       -> exchangeCodeForSession
 *  - token hash: ?token_hash=...&type=...        -> verifyOtp  (cross-device safe)
 *  - implicit:  #access_token=...&refresh_token  -> setSession
 *
 * Returns `{ session: null }` when the URL carries no auth payload, so callers
 * can pass through every incoming link without inspecting it first.
 * Throws when the link itself reports an error (e.g. expired token).
 */
export async function createSessionFromUrl(url: string): Promise<DeepLinkAuthResult> {
  const params = extractAuthParams(url);

  if (params.error || params.error_description) {
    throw new Error(params.error_description || params.error || 'Authentication link error');
  }

  const type = params.type;

  if (params.code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (error) throw error;
    return { session: data.session, type };
  }

  if (params.token_hash && type) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: params.token_hash,
      type: type as EmailOtpType,
    });
    if (error) throw error;
    return { session: data.session, type };
  }

  if (params.access_token && params.refresh_token) {
    const { data, error } = await supabase.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    });
    if (error) throw error;
    return { session: data.session, type };
  }

  return { session: null, type };
}
