export interface LeadPayload {
  name: string;
  email: string;
  phone?: string;
  consent: boolean;
  source: 'deal-check' | 'provider-check';
  summary?: Record<string, string | number>;
  company?: string; // honeypot
}

/** Sends a lead to the Pages Function at /api/lead (Brevo + optional Google Sheets webhook). */
export async function submitLead(payload: LeadPayload): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch('/api/lead', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) return { ok: true };
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    return { ok: false, error: data.error ?? 'Something went wrong. Please try again.' };
  } catch {
    // Local dev has no function running; let the flow continue.
    if (import.meta.env.DEV) return { ok: true };
    return { ok: false, error: 'Network problem. Please try again.' };
  }
}

export const REPORT_PRICE = import.meta.env.VITE_REPORT_PRICE || '£9';
export const STRIPE_LINK: string | undefined = import.meta.env.VITE_STRIPE_PAYMENT_LINK || undefined;

export function stripeUrl(email?: string) {
  if (!STRIPE_LINK) return undefined;
  const u = new URL(STRIPE_LINK);
  if (email) u.searchParams.set('prefilled_email', email);
  return u.toString();
}
