/**
 * Email templates for Overflow Rentals.
 *
 * Each template returns `{ subject, html, text }`. The HTML is styled inline
 * (no external CSS) following react-email / "Email on Acid" best practices so
 * it renders consistently across Gmail, Apple Mail, and Outlook.
 *
 * All templates share `wrapHtml()` for the outer table layout, header logo,
 * and footer — keeping per-template content focused on the body.
 */

export type TemplateName =
  | 'welcome'
  | 'login_alert'
  | 'maintenance_reminder'
  | 'password_reset_confirmation';

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

const BRAND = '#1F3A52';
const ACCENT = '#593CFB';
const TEXT = '#0F172A';
const TEXT_MUTED = '#64748B';
const BG = '#F7F8FA';
const BORDER = '#E5E7EB';

const APP_NAME = 'Overflow Rentals';
const APP_TAGLINE = 'The all-in-one platform for Turo hosts';

function escape(s: string | number | null | undefined): string {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function button(label: string, url: string): string {
  return `
    <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin:24px 0">
      <tr>
        <td align="center" bgcolor="${ACCENT}" style="border-radius:8px">
          <a href="${escape(url)}"
             style="display:inline-block;padding:12px 22px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px">
            ${escape(label)}
          </a>
        </td>
      </tr>
    </table>`;
}

function wrapHtml(opts: { title: string; preheader: string; body: string }): string {
  const { title, preheader, body } = opts;
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>${escape(title)}</title>
  </head>
  <body style="margin:0;padding:0;background:${BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:${TEXT};">
    <span style="display:none;visibility:hidden;mso-hide:all;opacity:0;color:transparent;height:0;width:0;font-size:1px;line-height:1px">
      ${escape(preheader)}
    </span>
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="${BG}">
      <tr>
        <td align="center" style="padding:32px 16px">
          <table role="presentation" width="560" border="0" cellspacing="0" cellpadding="0"
                 style="max-width:560px;background:#FFFFFF;border-radius:12px;border:1px solid ${BORDER};overflow:hidden">
            <tr>
              <td style="padding:24px 28px;border-bottom:1px solid ${BORDER};background:${BRAND}">
                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="font-size:18px;font-weight:700;color:#FFFFFF;letter-spacing:-0.3px">${APP_NAME}</td>
                    <td align="right" style="font-size:11px;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:0.5px">
                      ${APP_TAGLINE}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 28px;font-size:15px;line-height:24px;color:${TEXT}">
                ${body}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 28px;background:${BG};border-top:1px solid ${BORDER};font-size:12px;line-height:18px;color:${TEXT_MUTED}">
                You're receiving this because you have an Overflow Rentals account.
                <br />
                © ${new Date().getFullYear()} Overflow Rentals · All rights reserved.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

// ---------------------------------------------------------------------------
// welcome
// ---------------------------------------------------------------------------

interface WelcomeData {
  name?: string;
  appUrl?: string;
}

function welcome(data: WelcomeData): RenderedEmail {
  const name = data.name?.trim() || 'there';
  const appUrl = data.appUrl ?? 'https://overflowrentals.app';
  const subject = `Welcome to ${APP_NAME}, ${name}`;
  const text = `Hi ${name},

Welcome to ${APP_NAME} — the easiest way to run your Turo fleet like a real business.

Here's what you can do next:
1. Add your first vehicle so we can track expenses and earnings against it.
2. Import your existing Turo trips with the CSV upload tool.
3. Set up maintenance schedules so you never miss an oil change.

Open the app: ${appUrl}

If you have questions, just reply to this email.

— The ${APP_NAME} team`;

  const html = wrapHtml({
    title: subject,
    preheader: `Three quick things to do in ${APP_NAME} to get the most out of it.`,
    body: `
      <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;letter-spacing:-0.3px;color:${TEXT}">
        Welcome to ${APP_NAME}
      </h1>
      <p style="margin:0 0 16px;color:${TEXT_MUTED}">
        Hi ${escape(name)} — thanks for joining. ${APP_NAME} helps you run your Turo fleet like a real business: track every expense, see your real margin per car, and never miss a maintenance reminder.
      </p>
      <p style="margin:0 0 8px;font-weight:600">Three things to do next:</p>
      <ol style="margin:0 0 0 20px;padding:0;color:${TEXT}">
        <li style="margin-bottom:6px">Add your first vehicle.</li>
        <li style="margin-bottom:6px">Import your trips from a Turo CSV export.</li>
        <li>Set up maintenance schedules so we can remind you before things break.</li>
      </ol>
      ${button('Open the app', appUrl)}
      <p style="margin:24px 0 0;color:${TEXT_MUTED};font-size:13px">
        Reply to this email if you have questions — a real person reads every reply.
      </p>
    `,
  });
  return { subject, html, text };
}

// ---------------------------------------------------------------------------
// login_alert
// ---------------------------------------------------------------------------

interface LoginAlertData {
  name?: string;
  ip?: string;
  device?: string;
  whenIso?: string;
  resetUrl?: string;
}

function loginAlert(data: LoginAlertData): RenderedEmail {
  const name = data.name?.trim() || 'there';
  const when = data.whenIso ? new Date(data.whenIso).toUTCString() : new Date().toUTCString();
  const subject = `New sign-in to your ${APP_NAME} account`;
  const resetUrl = data.resetUrl ?? 'https://overflowrentals.app/(auth)/forgot-password';
  const text = `Hi ${name},

We noticed a new sign-in to your ${APP_NAME} account.

When: ${when}
Device: ${data.device ?? 'Unknown'}
IP: ${data.ip ?? 'Unknown'}

If this was you, you can ignore this email.
If it wasn't, reset your password immediately: ${resetUrl}

— ${APP_NAME} security`;

  const html = wrapHtml({
    title: subject,
    preheader: `New sign-in detected — ${when}`,
    body: `
      <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:${TEXT}">
        New sign-in to your account
      </h1>
      <p style="margin:0 0 16px;color:${TEXT_MUTED}">
        Hi ${escape(name)} — a new sign-in was just detected on your ${APP_NAME} account.
      </p>
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0"
             style="margin:0 0 24px;border:1px solid ${BORDER};border-radius:8px">
        <tr><td style="padding:12px 16px;border-bottom:1px solid ${BORDER};font-size:13px;color:${TEXT_MUTED}">When</td><td style="padding:12px 16px;border-bottom:1px solid ${BORDER};font-size:13px;font-weight:600">${escape(when)}</td></tr>
        <tr><td style="padding:12px 16px;border-bottom:1px solid ${BORDER};font-size:13px;color:${TEXT_MUTED}">Device</td><td style="padding:12px 16px;border-bottom:1px solid ${BORDER};font-size:13px;font-weight:600">${escape(data.device ?? 'Unknown')}</td></tr>
        <tr><td style="padding:12px 16px;font-size:13px;color:${TEXT_MUTED}">IP address</td><td style="padding:12px 16px;font-size:13px;font-weight:600">${escape(data.ip ?? 'Unknown')}</td></tr>
      </table>
      <p style="margin:0 0 8px"><strong>Was this you?</strong></p>
      <p style="margin:0 0 16px;color:${TEXT_MUTED}">If yes, you can safely ignore this email.</p>
      <p style="margin:0 0 8px"><strong>Wasn't you?</strong></p>
      <p style="margin:0;color:${TEXT_MUTED}">Someone may have your password. Reset it right now:</p>
      ${button('Reset password', resetUrl)}
    `,
  });
  return { subject, html, text };
}

// ---------------------------------------------------------------------------
// maintenance_reminder
// ---------------------------------------------------------------------------

interface MaintenanceItem {
  vehicle_name: string;
  type: string;
  due_date?: string | null;
  due_odometer?: number | null;
  days_until_due?: number | null;
  km_until_due?: number | null;
  severity: 'overdue' | 'soon' | 'upcoming';
}

interface MaintenanceReminderData {
  name?: string;
  items: MaintenanceItem[];
  appUrl?: string;
}

function describeItem(it: MaintenanceItem): string {
  const t = it.type.replace(/_/g, ' ');
  if (it.severity === 'overdue') {
    if (it.days_until_due != null && it.days_until_due < 0) return `${t} — ${Math.abs(it.days_until_due)} days overdue`;
    if (it.km_until_due != null && it.km_until_due < 0) return `${t} — ${Math.abs(it.km_until_due).toLocaleString()} km overdue`;
    return `${t} — overdue`;
  }
  if (it.days_until_due != null) {
    if (it.days_until_due === 0) return `${t} — due today`;
    return `${t} — due in ${it.days_until_due} days`;
  }
  if (it.km_until_due != null) {
    return `${t} — due in ${it.km_until_due.toLocaleString()} km`;
  }
  return t;
}

function maintenanceReminder(data: MaintenanceReminderData): RenderedEmail {
  const name = data.name?.trim() || 'there';
  const items = data.items ?? [];
  const overdue = items.filter((i) => i.severity === 'overdue').length;
  const total = items.length;
  const subject = overdue > 0
    ? `${overdue} maintenance ${overdue === 1 ? 'item' : 'items'} overdue on your fleet`
    : `${total} upcoming maintenance ${total === 1 ? 'item' : 'items'} on your fleet`;

  const appUrl = data.appUrl ?? 'https://overflowrentals.app';

  const text = `Hi ${name},

Your ${APP_NAME} fleet has ${total} maintenance items coming up${overdue > 0 ? ` (${overdue} overdue)` : ''}:

${items.map((i) => `- ${i.vehicle_name}: ${describeItem(i)}`).join('\n')}

Open the app to schedule them: ${appUrl}/(app)/maintenance

— ${APP_NAME}`;

  const rows = items.map((i) => `
    <tr>
      <td style="padding:10px 14px;border-bottom:1px solid ${BORDER};font-size:13px;font-weight:600;color:${TEXT}">${escape(i.vehicle_name)}</td>
      <td style="padding:10px 14px;border-bottom:1px solid ${BORDER};font-size:13px;color:${i.severity === 'overdue' ? '#B91C1C' : TEXT}">
        ${escape(describeItem(i))}
      </td>
    </tr>`).join('');

  const html = wrapHtml({
    title: subject,
    preheader: `${overdue > 0 ? `${overdue} overdue · ` : ''}${total} maintenance ${total === 1 ? 'item' : 'items'} coming up`,
    body: `
      <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:${TEXT}">
        ${overdue > 0 ? 'Some maintenance is overdue' : 'Maintenance coming up'}
      </h1>
      <p style="margin:0 0 16px;color:${TEXT_MUTED}">
        Hi ${escape(name)} — here's a quick rundown of the next maintenance items on your fleet.
      </p>
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0"
             style="margin:0 0 8px;border:1px solid ${BORDER};border-radius:8px;overflow:hidden">
        <tr style="background:${BG}">
          <th align="left" style="padding:10px 14px;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:${TEXT_MUTED};border-bottom:1px solid ${BORDER}">Vehicle</th>
          <th align="left" style="padding:10px 14px;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:${TEXT_MUTED};border-bottom:1px solid ${BORDER}">Service</th>
        </tr>
        ${rows}
      </table>
      ${button('View in app', appUrl + '/(app)/maintenance')}
    `,
  });
  return { subject, html, text };
}

// ---------------------------------------------------------------------------
// password_reset_confirmation
// ---------------------------------------------------------------------------

function passwordResetConfirmation(data: { name?: string }): RenderedEmail {
  const name = data.name?.trim() || 'there';
  const subject = `Your ${APP_NAME} password was changed`;
  const text = `Hi ${name},

Your ${APP_NAME} password was changed. If this was you, no action is needed.

If you didn't change it, contact support immediately by replying to this email.

— ${APP_NAME} security`;
  const html = wrapHtml({
    title: subject,
    preheader: 'Your password was just changed.',
    body: `
      <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:${TEXT}">Password changed</h1>
      <p style="margin:0 0 16px;color:${TEXT_MUTED}">
        Hi ${escape(name)} — your ${APP_NAME} password was just changed.
      </p>
      <p style="margin:0 0 16px">If this was you, no action is needed.</p>
      <p style="margin:0;color:${TEXT_MUTED}">If it wasn't, reply to this email immediately.</p>
    `,
  });
  return { subject, html, text };
}

// ---------------------------------------------------------------------------
// Public dispatcher
// ---------------------------------------------------------------------------

export function renderTemplate(name: TemplateName, data: Record<string, unknown>): RenderedEmail {
  switch (name) {
    case 'welcome':
      return welcome(data as WelcomeData);
    case 'login_alert':
      return loginAlert(data as LoginAlertData);
    case 'maintenance_reminder':
      return maintenanceReminder(data as MaintenanceReminderData);
    case 'password_reset_confirmation':
      return passwordResetConfirmation(data as { name?: string });
    default:
      throw new Error(`Unknown template: ${name}`);
  }
}
