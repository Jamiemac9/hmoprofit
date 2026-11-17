import { afterEach, describe, expect, it, vi } from 'vitest';
import { onRequestPost } from './lead';

const req = (body: unknown) => new Request('https://x/api/lead', { method: 'POST', body: JSON.stringify(body) });
const good = { name: 'Sam Patel', email: 'sam@example.com', phone: '07700 900123', role: 'landlord', consent: true, source: 'deal-check' };

afterEach(() => vi.restoreAllMocks());

describe('POST /api/lead', () => {
  it('rejects a missing or non-UK phone number', async () => {
    const res = await onRequestPost({ request: req({ ...good, phone: '12345' }), env: {} });
    expect(res.status).toBe(400);
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

  it('retries with name only when Brevo rejects the attributes', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('{}', { status: 400 }))
      .mockResolvedValueOnce(new Response(null, { status: 201 }));
    const res = await onRequestPost({ request: req(good), env: { BREVO_API_KEY: 'k' } });
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(JSON.parse(String(fetchMock.mock.calls[1][1]?.body)).attributes).toEqual({ FIRSTNAME: 'Sam', LASTNAME: 'Patel' });
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
