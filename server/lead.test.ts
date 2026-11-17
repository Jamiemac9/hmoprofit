import { afterEach, describe, expect, it, vi } from 'vitest';
import { handleLead } from './lead';

const onRequestPost = ({ request, env }: { request: Request; env: Record<string, string> }) => handleLead(request, env);

const req = (body: unknown) => new Request('https://x/api/lead', { method: 'POST', body: JSON.stringify(body) });
const good = { name: 'Sam Patel', email: 'sam@example.com', phone: '07700 900123', role: 'landlord', consent: true, source: 'deal-check' };

afterEach(() => vi.restoreAllMocks());

describe('POST /api/lead', () => {
  it('rejects a missing or non-UK phone number', async () => {
    const res = await onRequestPost({ request: req({ ...good, phone: '12345' }), env: {} });
    expect(res.status).toBe(400);
  });

  it('refuses with 503 when there is nowhere to save the lead', async () => {
    const res = await onRequestPost({ request: req(good), env: {} });
    expect(res.status).toBe(503);
  });

  it('requires consent', async () => {
    const res = await onRequestPost({ request: req({ ...good, consent: false }), env: {} });
    expect(res.status).toBe(400);
  });

  it('sends the phone to Brevo in E.164 with role and source', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 201 }));
    const res = await onRequestPost({ request: req(good), env: { BREVO_API_KEY: 'k', BREVO_LIST_ID: '7' } });
    expect(res.status).toBe(200);
    const sent = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(sent.attributes).toMatchObject({ FIRSTNAME: 'Sam', LASTNAME: 'Patel', SMS: '+447700900123', ROLE: 'landlord', SOURCE: 'hmoprofit-deal-check' });
    expect(sent.listIds).toEqual([7]);
  });

  it('retries without the phone, then name only, when Brevo rejects attributes', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('{}', { status: 400 }))
      .mockResolvedValueOnce(new Response('{}', { status: 400 }))
      .mockResolvedValueOnce(new Response(null, { status: 201 }));
    const res = await onRequestPost({ request: req(good), env: { BREVO_API_KEY: 'k' } });
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(JSON.parse(String(fetchMock.mock.calls[1][1]?.body)).attributes.SMS).toBeUndefined();
    expect(JSON.parse(String(fetchMock.mock.calls[2][1]?.body)).attributes).toEqual({ FIRSTNAME: 'Sam', LASTNAME: 'Patel' });
  });

  it('rejects anything but POST', async () => {
    const res = await handleLead(new Request('https://x/api/lead'), {});
    expect(res.status).toBe(405);
  });

  it('accepts +44 numbers and passes them to the Sheets webhook', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 200 }));
    await onRequestPost({ request: req({ ...good, phone: '+44 121 496 0000' }), env: { SHEETS_WEBHOOK_URL: 'https://hook' } });
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body)).phone).toBe('+441214960000');
  });

  it('quietly accepts honeypot submissions without sending anything', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    const res = await onRequestPost({ request: req({ ...good, company: 'spam' }), env: { BREVO_API_KEY: 'k' } });
    expect(res.status).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('provider review requests', () => {
  it('emails the inbox with the details, escaped, and still saves the lead', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 201 }));
    const res = await onRequestPost({
      request: req({ ...good, source: 'provider-review', summary: { provider_name: 'Acme <Support>', property_area: 'B29' } }),
      env: { BREVO_API_KEY: 'k', NOTIFY_EMAIL: 'info@hmoprofit.co.uk', BREVO_SENDER_EMAIL: 'info@hmoprofit.co.uk' },
    });
    expect(res.status).toBe(200);
    const urls = fetchMock.mock.calls.map((c) => String(c[0]));
    expect(urls).toContain('https://api.brevo.com/v3/smtp/email');
    expect(urls).toContain('https://api.brevo.com/v3/contacts');
    const mail = JSON.parse(String(fetchMock.mock.calls.find((c) => String(c[0]).includes('smtp'))![1]?.body));
    expect(mail.subject).toContain('Acme <Support>');
    expect(mail.htmlContent).toContain('Acme &lt;Support&gt;');
    expect(mail.replyTo.email).toBe('sam@example.com');
  });

  it('does not email the inbox for ordinary deal-check leads', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 201 }));
    await onRequestPost({ request: req(good), env: { BREVO_API_KEY: 'k', NOTIFY_EMAIL: 'a@b.co', BREVO_SENDER_EMAIL: 'a@b.co' } });
    expect(fetchMock.mock.calls.map((c) => String(c[0]))).not.toContain('https://api.brevo.com/v3/smtp/email');
  });
});
