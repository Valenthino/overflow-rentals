// Supabase Edge Function: send-email
//
// Renders one of the templates in `_shared/email-templates.ts` and sends it
// via Resend. The function is invoked from the client through the Supabase
// JS SDK (`supabase.functions.invoke('send-email', { body: { to, template, data } })`)
// and from scheduled cron jobs that walk the `maintenance` table.
//
// Required env vars (set with `supabase secrets set`):
//   RESEND_API_KEY              your Resend API key
//   RESEND_FROM_EMAIL           e.g. "Overflow Rentals <hello@overflowrentals.app>"
//
// Optional:
//   ALLOWED_ORIGIN              comma-separated CORS origins, defaults to "*"
//
// To deploy: `supabase functions deploy send-email --no-verify-jwt=false`

// @ts-ignore — Deno std import; ignored by the TS compiler in the Expo bundle.
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { renderTemplate, type TemplateName } from '../_shared/email-templates.ts';

// @ts-ignore — Deno globals
declare const Deno: { env: { get(name: string): string | undefined } };

interface SendEmailRequest {
  to: string | string[];
  template: TemplateName;
  data: Record<string, unknown>;
  replyTo?: string;
}

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

function corsHeaders(origin: string | null): Record<string, string> {
  const allow = Deno.env.get('ALLOWED_ORIGIN') ?? '*';
  const allowed = allow === '*' || (origin && allow.split(',').map((s) => s.trim()).includes(origin));
  return {
    'Access-Control-Allow-Origin': allowed && origin ? origin : '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info',
    'Access-Control-Max-Age': '86400',
  };
}

function jsonResponse(body: unknown, status: number, origin: string | null): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}

serve(async (req) => {
  const origin = req.headers.get('origin');

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, origin);
  }

  const apiKey = Deno.env.get('RESEND_API_KEY');
  const fromEmail = Deno.env.get('RESEND_FROM_EMAIL');
  if (!apiKey || !fromEmail) {
    return jsonResponse(
      { error: 'Email service not configured. Set RESEND_API_KEY and RESEND_FROM_EMAIL.' },
      500,
      origin,
    );
  }

  let body: SendEmailRequest;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400, origin);
  }

  if (!body.to || !body.template) {
    return jsonResponse({ error: 'Missing required fields: to, template' }, 400, origin);
  }

  let rendered;
  try {
    rendered = renderTemplate(body.template, body.data ?? {});
  } catch (e) {
    return jsonResponse({ error: (e as Error).message }, 400, origin);
  }

  const recipients = Array.isArray(body.to) ? body.to : [body.to];
  const resendBody: Record<string, unknown> = {
    from: fromEmail,
    to: recipients,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
  };
  if (body.replyTo) resendBody.reply_to = body.replyTo;

  const resp = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(resendBody),
  });

  if (!resp.ok) {
    const text = await resp.text();
    return jsonResponse(
      { error: 'Resend API error', status: resp.status, detail: text },
      502,
      origin,
    );
  }

  const result = await resp.json();
  return jsonResponse({ ok: true, id: result.id ?? null }, 200, origin);
});
