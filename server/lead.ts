/**
 * Lead handler behind POST /api/lead. Host-neutral: takes a web Request and an env object.
 * Netlify wiring: netlify/functions/lead.mts.
 *
 * Adds the contact to Brevo (BREVO_API_KEY, BREVO_LIST_ID), emails provider review requests
 * to NOTIFY_EMAIL, and, if set, forwards the row to a Google Sheets webhook (SHEETS_WEBHOOK_URL).
 */
export interface Env {
  BREVO_API_KEY?: string;
  BREVO_LIST_ID?: string;
  SHEETS_WEBHOOK_URL?: string;
  /** Where provider review requests are emailed, e.g. info@hmoprofit.co.uk */
  NOTIFY_EMAIL?: string;
  /** A sender verified in Brevo, e.g. info@hmoprofit.co.uk */
  BREVO_SENDER_EMAIL?: string;
}

interface Body {
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  consent?: boolean;
  source?: string;
  summary?: Record<string, unknown>;
  company?: string;
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ROLES = ['investor', 'landlord', 'provider', 'sourcer', 'other'];

/** UK number to E.164 (+447700900123), or null if it isn't one. */
function ukE164(raw: string): string | null {
  const d = raw.replace(/[\s()-]/g, '');
  const m = d.match(/^(?:\+44|0044|0)(\d{9,10})$/);
  return m ? `+44${m[1]}` : null;
}

export async function handleLead(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid request.' }, 400);
  }
  if (body.company) return json({ ok: true }); // honeypot: pretend success
  const name = (body.name ?? '').trim().slice(0, 120);
  const email = (body.email ?? '').trim().toLowerCase().slice(0, 200);
  const phone = ukE164((body.phone ?? '').trim().slice(0, 40));
  const role = ROLES.includes(body.role ?? '') ? (body.role as string) : 'other';
  if (!name) return json({ error: 'Please enter your name.' }, 400);
  if (!EMAIL.test(email)) return json({ error: 'Please enter a valid email address.' }, 400);
  if (!phone) return json({ error: 'Please enter a UK phone number.' }, 400);
  if (body.consent !== true) return json({ error: 'Please tick the consent box.' }, 400);
  const SOURCES = ['deal-check', 'provider-check', 'provider-review'];
  const source = SOURCES.includes(body.source ?? '') ? (body.source as string) : 'deal-check';

  // Never accept a lead with nowhere to put it: fail loudly so the visitor can email instead.
  if (!env.BREVO_API_KEY && !env.SHEETS_WEBHOOK_URL) {
    console.error('lead: no BREVO_API_KEY or SHEETS_WEBHOOK_URL set; lead not saved');
    return json({ error: 'Our form is not taking submissions right now. Please email info@hmoprofit.co.uk.' }, 503);
  }

  const tasks: Promise<Response>[] = [];
  if (env.BREVO_API_KEY) {
    const [first, ...rest] = name.split(/\s+/);
    const send = (attributes: Record<string, string>) =>
      fetch('https://api.brevo.com/v3/contacts', {
        method: 'POST',
        headers: { 'api-key': env.BREVO_API_KEY!, 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({
          email,
          updateEnabled: true,
          attributes,
          listIds: env.BREVO_LIST_ID ? [Number(env.BREVO_LIST_ID)] : undefined,
        }),
      });
    // Full attributes first. If Brevo rejects one (a missing custom field, or a phone number
    // already on another contact), retry without the phone, then with the name only.
    const base = { FIRSTNAME: first, LASTNAME: rest.join(' ') };
    const attempts = [
      { ...base, SMS: phone, ROLE: role, SOURCE: `hmoprofit-${source}` },
      { ...base, ROLE: role, SOURCE: `hmoprofit-${source}` },
      base,
    ];
    tasks.push(
      (async () => {
        let res = await send(attempts[0]);
        for (let n = 1; n < attempts.length && res.status === 400; n++) res = await send(attempts[n]);
        return res;
      })(),
    );
  }
  if (env.SHEETS_WEBHOOK_URL) {
    tasks.push(
      fetch(env.SHEETS_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ at: new Date().toISOString(), name, email, phone, role, source, ...(body.summary ?? {}) }),
      }),
    );
  }

  // A provider review request is a sales enquiry: email it straight to the inbox as well.
  // Sent separately so a failed notification never loses the lead.
  if (source === 'provider-review' && env.BREVO_API_KEY && env.NOTIFY_EMAIL && env.BREVO_SENDER_EMAIL) {
    const rows = Object.entries({ name, email, phone, role, ...(body.summary ?? {}) })
      .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#555">${esc(k)}</td><td style="padding:4px 0">${esc(String(v ?? ''))}</td></tr>`)
      .join('');
    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': env.BREVO_API_KEY, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        sender: { email: env.BREVO_SENDER_EMAIL, name: 'HMO Profit' },
        to: [{ email: env.NOTIFY_EMAIL }],
        replyTo: { email, name },
        subject: `Provider review request: ${String(body.summary?.provider_name ?? 'unnamed provider').slice(0, 80)} (${name})`,
        htmlContent: `<p>New provider review request from hmoprofit.co.uk. Call back to agree scope and fee.</p><table>${rows}</table>`,
      }),
    }).catch(() => undefined);
  }

  const results = await Promise.allSettled(tasks);
  const failed = results.filter((r) => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.ok && r.value.status !== 204));
  if (tasks.length > 0 && failed.length === tasks.length) {
    return json({ error: 'We could not save your details just now. Please try again.' }, 502);
  }
  return json({ ok: true });
}
