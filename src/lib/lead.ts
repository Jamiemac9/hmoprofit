export type Role = 'investor' | 'landlord' | 'provider' | 'sourcer' | 'other';

export const ROLES: { value: Role; label: string }[] = [
  { value: 'investor', label: 'Buying my next property' },
  { value: 'landlord', label: 'Landlord with properties now' },
  { value: 'provider', label: 'Supported housing provider' },
  { value: 'sourcer', label: 'Deal sourcer or agent' },
  { value: 'other', label: 'Something else' },
];

export interface LeadPayload {
  name: string;
  email: string;
  phone: string;
  role: Role;
  consent: boolean;
  source: 'deal-check' | 'provider-check' | 'provider-review';
  summary?: Record<string, string | number>;
  company?: string; // honeypot
}

/** UK mobile or landline: 07…, 01…, 02…, 03…, or +44 equivalents. Spaces and dashes allowed. */
export const UK_PHONE = /^(?:\+44\s?|0)(?:\d\s?-?){9,10}$/;

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

export interface LeadProfile {
  name: string;
  role: Role;
}

export function saveProfile(p: LeadProfile) {
  try {
    localStorage.setItem('hp-lead', '1');
    localStorage.setItem('hp-profile', JSON.stringify(p));
  } catch {
    /* storage unavailable */
  }
}

export function readProfile(): LeadProfile | null {
  try {
    if (localStorage.getItem('hp-lead') !== '1') return null;
    return JSON.parse(localStorage.getItem('hp-profile') ?? 'null') ?? { name: '', role: 'other' };
  } catch {
    return null;
  }
}
