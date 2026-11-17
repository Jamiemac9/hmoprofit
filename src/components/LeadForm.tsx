import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ROLES, saveProfile, submitLead, UK_PHONE, type LeadPayload, type LeadProfile, type Role } from '../lib/lead';

/** Name, email, UK phone, role and consent. Posts to /api/lead and remembers the person in this browser. */
export default function LeadForm({
  source,
  summary,
  onDone,
  title,
  text,
  button,
  busyLabel = 'Sending…',
}: {
  source: LeadPayload['source'];
  summary: Record<string, string | number>;
  onDone: (p: LeadProfile) => void;
  title: string;
  text: string;
  button: string;
  busyLabel?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const name = String(f.get('name') ?? '').trim();
    const phone = String(f.get('phone') ?? '').trim();
    const role = String(f.get('role') ?? 'other') as Role;
    if (!UK_PHONE.test(phone)) {
      setError('Please enter a UK phone number, for example 07700 900123.');
      return;
    }
    setBusy(true);
    setError(null);
    const res = await submitLead({
      name,
      email: String(f.get('email') ?? '').trim(),
      phone,
      role,
      consent: f.get('consent') === 'on',
      company: String(f.get('company') ?? ''),
      source,
      summary,
    });
    setBusy(false);
    if (res.ok) {
      saveProfile({ name, role });
      onDone({ name, role });
    }
    else setError(res.error ?? 'Something went wrong.');
  };
  return (
    <form onSubmit={submit} className="rounded-[8px] border border-white/15 bg-[#0b0c0d]/95 p-6 shadow-2xl backdrop-blur sm:p-8">
      <h3 className="text-[22px] font-medium tracking-tight">{title}</h3>
      <p className="mt-1 text-[14px] leading-relaxed text-white/75">{text}</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="lead-name" className="mb-2 block text-[14px] font-medium">Name</label>
          <input id="lead-name" name="name" required autoComplete="name" className="field" />
        </div>
        <div>
          <label htmlFor="lead-email" className="mb-2 block text-[14px] font-medium">Email</label>
          <input id="lead-email" name="email" type="email" required autoComplete="email" className="field" />
        </div>
        <div>
          <label htmlFor="lead-phone" className="mb-2 block text-[14px] font-medium">Phone</label>
          <input id="lead-phone" name="phone" type="tel" required autoComplete="tel" inputMode="tel" placeholder="07700 900123" className="field" />
        </div>
        <div>
          <label htmlFor="lead-role" className="mb-2 block text-[14px] font-medium">Which fits you best?</label>
          <select id="lead-role" name="role" required defaultValue="" className="field appearance-none">
            <option value="" disabled>Choose one</option>
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
        <div className="hidden" aria-hidden="true">
          <label htmlFor="lead-company">Company</label>
          <input id="lead-company" name="company" tabIndex={-1} autoComplete="off" />
        </div>
        <label className="flex items-start gap-3 text-[13px] leading-relaxed text-white/80 sm:col-span-2">
          <input type="checkbox" name="consent" required className="mt-1 h-4 w-4 accent-[#1E6EF3]" />
          <span>
            Email me about my results and related property updates, and call me if it would help. Unsubscribe any time. See the <Link to="/privacy-policy" className="underline">privacy policy</Link>.
          </span>
        </label>
      </div>
      {error && <p role="alert" className="mt-4 text-[14px] text-risk">{error}</p>}
      <button type="submit" disabled={busy} className="btn btn-signal mt-5 w-full disabled:opacity-60">
        {busy ? busyLabel : button}
      </button>
    </form>
  );
}

