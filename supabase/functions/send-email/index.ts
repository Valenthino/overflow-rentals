// Supabase Edge Function: send-email
// ---------------------------------------------------------------------------
// Foundation for future transactional / product email (booking reminders,
// payout notices, claim updates, …) sent through Resend.
//
// Auth emails (signup confirmation, password reset, magic link) do NOT go
// through here — those are sent by Supabase Auth via the Resend SMTP settings
// configured in the dashboard. See docs/DEPLOYMENT.md.
//
// Deploy + configure (the Resend key is a runtime secret, never committed):
//   supabase functions deploy send-email --project-ref gwcylyxbmzoyxsevripv
//   supabase secrets set RESEND_API_KEY=<your_resend_key> --project-ref gwcylyxbmzoyxsevripv
//
// Invoke from the app:
//   await supabase.functions.invoke('send-email', {
//     body: { to: 'host@example.com', subject: 'Hi', html: '<p>…</p>' },
//   });
// ---------------------------------------------------------------------------

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
// Must be an address on a domain verified in Resend (e.g. app.ovfleet.com).
const DEFAULT_FROM = Deno.env.get('EMAIL_FROM') ?? 'Overflow Fleet <no-reply@app.ovfleet.com>';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface SendEmailPayload {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }
  if (!RESEND_API_KEY) {
    return json({ error: 'RESEND_API_KEY is not configured for this function' }, 500);
  }

  let payload: SendEmailPayload;
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  if (!payload.to || !payload.subject || (!payload.html && !payload.text)) {
    return json({ error: 'Missing required fields: to, subject, and html or text' }, 400);
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: payload.from ?? DEFAULT_FROM,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      reply_to: payload.replyTo,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return json({ error: 'Resend request failed', detail: data }, res.status);
  }
  return json({ id: (data as { id?: string }).id ?? null });
});
