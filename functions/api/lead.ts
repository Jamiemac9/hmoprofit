/**
 * Cloudflare Pages Function: POST /api/lead
 * Adds the contact to Brevo (BREVO_API_KEY, BREVO_LIST_ID) and, if set,
 * forwards the row to a Google Sheets webhook (SHEETS_WEBHOOK_URL).
 */
interface Env {
  BREVO_API_KEY?: string;
  BREVO_LIST_ID?: string;
  SHEETS_WEBHOOK_URL?: string;
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

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ROLES = ['investor', 'landlord', 'provider', 'sourcer', 'other'];

/** UK number to E.164 (+447700900123), or null if it isn't one. */
function ukE164(raw: string): string | null {
  const d = raw.replace(/[\s()-]/g, '');
  const m = d.match(/^(?:\+44|0044|0)(\d{9,10})$/);
  return m ? `+44${m[1]}` : null;
}

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
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
  const source = body.source === 'provider-check' ? 'provider-check' : 'deal-check';

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
    // Full attributes first. If the account lacks the custom ones (ROLE, SOURCE) or rejects the
    // number as SMS, Brevo answers 400, so retry with the built-in name fields only.
    tasks.push(
      send({ FIRSTNAME: first, LASTNAME: rest.join(' '), SMS: phone, ROLE: role, SOURCE: `hmoprofit-${source}` }).then((r) =>
        r.status === 400 ? send({ FIRSTNAME: first, LASTNAME: rest.join(' ') }) : r,
      ),
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

  const results = await Promise.allSettled(tasks);
  const failed = results.filter((r) => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.ok && r.value.status !== 204));
  if (tasks.length > 0 && failed.length === tasks.length) {
    return json({ error: 'We could not save your details just now. Please try again.' }, 502);
  }
  return json({ ok: true });
};
