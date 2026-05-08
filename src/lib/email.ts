import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export type EmailTemplate =
  | 'welcome'
  | 'login_alert'
  | 'maintenance_reminder'
  | 'password_reset_confirmation';

interface SendEmailParams {
  to: string;
  template: EmailTemplate;
  data: Record<string, unknown>;
}

/**
 * Sends a transactional email via the `send-email` Supabase Edge Function.
 * The function is responsible for rendering the template and calling Resend.
 *
 * Returns `{ ok: false, reason }` if Supabase isn't configured or the function
 * returns an error — callers should treat email as best-effort, never blocking.
 */
export async function sendEmail({ to, template, data }: SendEmailParams): Promise<
  { ok: true } | { ok: false; reason: string }
> {
  if (!isSupabaseConfigured) {
    return { ok: false, reason: 'Supabase not configured' };
  }
  try {
    const { data: result, error } = await supabase.functions.invoke('send-email', {
      body: { to, template, data },
    });
    if (error) {
      if (__DEV__) console.warn('[email] invoke failed', error);
      return { ok: false, reason: error.message };
    }
    if (result && typeof result === 'object' && 'error' in result && result.error) {
      return { ok: false, reason: String(result.error) };
    }
    return { ok: true };
  } catch (e: any) {
    if (__DEV__) console.warn('[email] send failed', e);
    return { ok: false, reason: e?.message ?? 'Unknown error' };
  }
}
