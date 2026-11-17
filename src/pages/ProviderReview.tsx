import { useLayoutEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { REVIEW, REVIEW_AREAS } from '../lib/service';
import { saveProfile, submitLead, UK_PHONE, type Role } from '../lib/lead';
import { SITES } from '../lib/network';
import { setupReveals } from '../lib/motion';
import { usePageMeta } from '../lib/meta';

const STEPS = [
  { t: 'Request', d: 'Tell us about the property, the provider and when you need to decide. Takes two minutes.' },
  { t: 'Agree the scope', d: 'We call you, confirm what we will check and the fixed fee. Nothing to pay until you agree.' },
  { t: 'Provider documents', d: 'You send the provider our document request, or we contact them with your permission.' },
  { t: 'Report and call', d: `Written report within ${REVIEW.turnaroundDays} working days of the documents arriving, then a ${REVIEW.callMinutes}-minute call.` },
];

const GET = [
  'A written report rating each of the four areas red, amber or green, with the evidence behind each rating',
  'An overall view: sign, sign with conditions, or don’t sign yet',
  'The lease points to take to your solicitor, in plain English',
  'Questions still open with the provider, ready to send',
  `A ${REVIEW.callMinutes}-minute call to walk you through it`,
];

const FAQ = [
  {
    q: 'Is this legal advice?',
    a: 'No. We review the provider and flag lease points from a property and compliance view. Have a solicitor review the lease before you sign; our report gives them a head start.',
  },
  {
    q: 'What if the provider won’t share documents?',
    a: 'We still complete the public-record checks and review the draft lease, and the refusal goes in the report. A provider that can’t show its support evidence to a landlord will struggle to show it to a council.',
  },
  {
    q: 'Do you need resident information?',
    a: 'No. We ask providers to anonymise everything. We need to see that support is planned and recorded, not who it is for.',
  },
  {
    q: 'Where do you cover?',
    a: 'Schemes in England. The review is done remotely from documents, public records and calls.',
  },
  {
    q: 'I’m a provider. Can I buy this about myself?',
    a: `Not this one: it is written for the landlord. For an independent check of your own evidence, use ${SITES.supportAudit.name}.`,
  },
  {
    q: 'Do you take fees from providers?',
    a: 'No referral fees, ever. If a provider you had us review later asks us for a service, we tell you first.',
  },
];

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: 'landlord', label: 'I own the property' },
  { value: 'investor', label: "I'm buying it for this lease" },
  { value: 'sourcer', label: 'Agent or sourcer for the owner' },
  { value: 'other', label: 'Something else' },
];

function RequestForm() {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) ?? '').trim();
    if (!UK_PHONE.test(get('phone'))) {
      setError('Please enter a UK phone number, for example 07700 900123.');
      return;
    }
    setBusy(true);
    setError(null);
    const name = get('name');
    const role = (get('role') || 'other') as Role;
    const res = await submitLead({
      name,
      email: get('email'),
      phone: get('phone'),
      role,
      consent: f.get('consent') === 'on',
      company: get('company'),
      source: 'provider-review',
      summary: {
        property_area: get('area'),
        provider_name: get('provider'),
        lease_rent: get('rent'),
        lease_years: get('years'),
        decide_by: get('deadline'),
        provider_asked: get('asked'),
        notes: get('notes').slice(0, 1500),
      },
    });
    setBusy(false);
    if (res.ok) {
      saveProfile({ name, role });
      setDone(name.split(' ')[0] || 'there');
    } else setError(res.error ?? 'Something went wrong.');
  };

  if (done) {
    return (
      <div className="rounded-[8px] bg-white p-8 text-black" role="status">
        <p className="eyebrow text-black/60">Request received</p>
        <h3 className="mt-3 text-[30px] font-medium tracking-tight">Thanks, {done}.</h3>
        <p className="mt-3 text-[16px] leading-relaxed text-black/80">
          We'll call you within {REVIEW.responseTime} to agree the scope and fee. Nothing to pay until then. In the meantime, you can send the
          provider our document request so the review can start as soon as you're ready.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/provider-review/documents" className="btn btn-signal">Open the document request</Link>
          <Link to="/check" className="btn border border-black/20 text-black hover:border-black">Model the lease figures</Link>
        </div>
      </div>
    );
  }

  const label = 'mb-2 block text-[14px] font-medium';
  return (
    <form onSubmit={submit} className="rounded-[8px] border border-rule bg-panel p-6 sm:p-8" noValidate={false}>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="r-name" className={label}>Your name</label>
          <input id="r-name" name="name" required autoComplete="name" className="field" />
        </div>
        <div>
          <label htmlFor="r-role" className={label}>You are</label>
          <select id="r-role" name="role" required defaultValue="" className="field appearance-none">
            <option value="" disabled>Choose one</option>
            {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="r-email" className={label}>Email</label>
          <input id="r-email" name="email" type="email" required autoComplete="email" className="field" />
        </div>
        <div>
          <label htmlFor="r-phone" className={label}>Phone</label>
          <input id="r-phone" name="phone" type="tel" required autoComplete="tel" inputMode="tel" placeholder="07700 900123" className="field" />
        </div>
        <div>
          <label htmlFor="r-area" className={label}>Property town or postcode</label>
          <input id="r-area" name="area" required className="field" placeholder="e.g. B29 or Walsall" />
        </div>
        <div>
          <label htmlFor="r-provider" className={label}>Provider's name</label>
          <input id="r-provider" name="provider" required className="field" />
        </div>
        <div>
          <label htmlFor="r-rent" className={label}>Lease rent offered <span className="text-mist">(optional)</span></label>
          <input id="r-rent" name="rent" inputMode="decimal" className="field" placeholder="£ per month" />
        </div>
        <div>
          <label htmlFor="r-years" className={label}>Lease length <span className="text-mist">(optional)</span></label>
          <input id="r-years" name="years" inputMode="numeric" className="field" placeholder="Years" />
        </div>
        <div>
          <label htmlFor="r-deadline" className={label}>When do you need to decide? <span className="text-mist">(optional)</span></label>
          <input id="r-deadline" name="deadline" type="date" className="field" />
        </div>
        <div>
          <label htmlFor="r-asked" className={label}>Has the provider agreed to share documents?</label>
          <select id="r-asked" name="asked" required defaultValue="" className="field appearance-none">
            <option value="" disabled>Choose one</option>
            <option value="yes">Yes</option>
            <option value="not-asked">Not asked yet</option>
            <option value="reluctant">They seem reluctant</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="r-notes" className={label}>Anything we should know? <span className="text-mist">(optional)</span></label>
          <textarea id="r-notes" name="notes" rows={4} maxLength={1500} className="field min-h-[110px] py-3" placeholder="What they've promised, what's worrying you, any documents you already have." />
        </div>
        <div className="hidden" aria-hidden="true">
          <label htmlFor="r-company">Company</label>
          <input id="r-company" name="company" tabIndex={-1} autoComplete="off" />
        </div>
        <label className="flex items-start gap-3 text-[13px] leading-relaxed text-white/80 sm:col-span-2">
          <input type="checkbox" name="consent" required className="mt-1 h-4 w-4 accent-[#1E6EF3]" />
          <span>
            Contact me by phone and email about this review and related property updates. Unsubscribe any time. See the{' '}
            <Link to="/privacy-policy" className="underline">privacy policy</Link> and <Link to="/terms" className="underline">terms</Link>.
          </span>
        </label>
      </div>
      {error && <p role="alert" className="mt-4 text-[14px] text-risk">{error}</p>}
      <button type="submit" disabled={busy} className="btn btn-signal mt-6 w-full disabled:opacity-60 sm:w-auto sm:min-w-[260px]">
        {busy ? 'Sending…' : 'Request a provider review'}
      </button>
      <p className="mt-3 text-[13px] text-mist">No payment now. We agree the scope and fee with you first.</p>
    </form>
  );
}

export default function ProviderReview() {
  usePageMeta(
    `Provider review: check a supported housing provider before you sign | HMO Profit`,
    `We check a supported housing provider for you before you sign their lease: who they are, their support evidence, licensing readiness and the lease. ${REVIEW.price} fixed fee.`,
  );
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => (ref.current ? setupReveals(ref.current) : undefined), []);

  return (
    <div ref={ref}>
      <section className="wrap pt-20 pb-20">
        <p className="eyebrow text-mist">Provider review · done for you</p>
        <h1 data-split className="display mt-4 max-w-[17ch] text-[clamp(42px,7vw,104px)]">
          We check the provider before you sign the lease.
        </h1>
        <div className="mt-8 flex flex-wrap items-end justify-between gap-8">
          <p className="max-w-[640px] text-[18px] leading-relaxed text-white/80" data-reveal>
            A supported housing lease can look like five years of guaranteed rent. It's only as good as the provider behind it. We review
            who they are, whether their support stands up, whether they're ready for licensing, and what the lease leaves with you.
          </p>
          <div className="flex flex-col items-start gap-3" data-reveal>
            <p className="num text-[44px] leading-none">{REVIEW.price}<span className="ml-2 text-[15px] text-mist">{REVIEW.priceNote}</span></p>
            <div className="flex flex-wrap gap-3">
              <a href="#request" className="btn btn-signal">Request a review</a>
              <Link to="/provider-check" className="btn btn-ghost">Try the free check first</Link>
            </div>
          </div>
        </div>
      </section>

      {/* What we check */}
      <section className="border-t border-rule pt-24">
        <div className="wrap">
          <p className="eyebrow text-mist" data-reveal>What we check</p>
          <h2 data-split className="display mt-4 max-w-[780px] text-[clamp(36px,5vw,68px)]">Four areas, each rated red, amber or green</h2>
          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {REVIEW_AREAS.map((a, n) => (
              <article key={a.title} data-reveal className={`ticks rounded-[6px] p-8 ${n === 0 ? 'bg-signal' : 'bg-panel-2'}`}>
                <p className={`num text-[14px] ${n === 0 ? 'text-white/80' : 'text-mist'}`}>0{n + 1}</p>
                <h3 className="mt-3 text-[28px] font-medium tracking-tight">{a.title}</h3>
                <p className={`mt-2 text-[15px] leading-relaxed ${n === 0 ? 'text-white/90' : 'text-white/75'}`}>{a.what}</p>
                <ul className="mt-5 space-y-2.5 text-[14px]">
                  {a.checks.map((c) => (
                    <li key={c} className="flex gap-2.5">
                      <span className={`mt-[7px] h-1.5 w-1.5 shrink-0 ${n === 0 ? 'bg-white' : 'bg-signal'}`} aria-hidden="true" />
                      {c}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* What you get + price */}
      <section className="wrap grid gap-6 pt-28 lg:grid-cols-[1.4fr_1fr]">
        <div data-reveal>
          <p className="eyebrow text-mist">What you get</p>
          <h2 className="display mt-4 text-[clamp(36px,5vw,64px)]">A decision you can stand behind</h2>
          <ul className="mt-8 border-t border-rule">
            {GET.map((g, n) => (
              <li key={g} className="grid grid-cols-[48px_1fr] gap-4 border-b border-rule py-5 text-[16px] leading-relaxed">
                <span className="num text-mist">0{n + 1}</span>
                {g}
              </li>
            ))}
          </ul>
        </div>
        <aside data-reveal className="self-start rounded-[8px] bg-white p-8 text-black">
          <p className="eyebrow text-black/60">Fixed fee</p>
          <p className="num mt-3 text-[64px] leading-none">{REVIEW.price}</p>
          <p className="mt-2 text-[14px] text-black/70">{REVIEW.priceNote}. Agreed before any work starts.</p>
          <ul className="mt-6 space-y-2.5 text-[14px]">
            {['Public-record and registration checks', 'Review of the provider’s documents', 'Draft lease read-through', `Report within ${REVIEW.turnaroundDays} working days of documents`, `${REVIEW.callMinutes}-minute walkthrough call`].map((x) => (
              <li key={x} className="flex gap-2.5"><span className="mt-[7px] h-1.5 w-1.5 shrink-0 bg-signal" aria-hidden="true" />{x}</li>
            ))}
          </ul>
          <a href="#request" className="btn btn-signal mt-7 w-full">Request a review</a>
          <p className="mt-3 text-[12px] text-black/60">If the provider shares nothing, we still complete the public checks and the lease read-through, and their refusal goes in the report.</p>
        </aside>
      </section>

      {/* How it works */}
      <section className="wrap pt-28">
        <p className="eyebrow text-mist" data-reveal>How it works</p>
        <h2 data-split className="display mt-4 text-[clamp(36px,5vw,64px)]">From request to report</h2>
        <ol className="mt-12 grid gap-px overflow-hidden rounded-[8px] border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, n) => (
            <li key={s.t} data-reveal className="bg-ink p-7">
              <span className="num text-[44px] leading-none text-signal">{n + 1}</span>
              <h3 className="mt-6 text-[21px] font-medium tracking-tight">{s.t}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-white/75">{s.d}</p>
            </li>
          ))}
        </ol>
        <p className="mt-5 text-[15px] text-white/75" data-reveal>
          Want to get the provider moving now?{' '}
          <Link to="/provider-review/documents" className="underline underline-offset-4">Send them our document request</Link>.
        </p>
      </section>

      {/* Who + independence */}
      <section className="wrap grid gap-4 pt-28 md:grid-cols-2">
        <div data-reveal className="rounded-[8px] border border-rule bg-panel p-8">
          <p className="eyebrow text-mist">Who does the review</p>
          <h2 className="mt-4 text-[30px] font-medium tracking-tight">Jamie Mac</h2>
          <p className="mt-3 text-[16px] leading-relaxed text-white/80">
            Eight years in property and compliance, including managing supported accommodation, leading a council supported accommodation
            team and auditing providers' support files. The review asks what a commissioner or auditor would ask, before it's your rent at
            stake.
          </p>
        </div>
        <div data-reveal className="rounded-[8px] border border-rule bg-panel p-8">
          <p className="eyebrow text-mist">Independent</p>
          <h2 className="mt-4 text-[30px] font-medium tracking-tight">Working for you, not the provider</h2>
          <ul className="mt-4 space-y-3 text-[15px] leading-relaxed text-white/80">
            <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 bg-signal" aria-hidden="true" />No referral fees from providers, ever.</li>
            <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 bg-signal" aria-hidden="true" />If a provider we reviewed for you later asks us for a service, we tell you first.</li>
            <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 bg-signal" aria-hidden="true" />Not legal advice and not a guarantee. Your solicitor still reviews the lease.</li>
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section className="wrap pt-28">
        <h2 data-split className="display text-[clamp(36px,5vw,64px)]">Questions</h2>
        <div className="mt-10 border-t border-rule">
          {FAQ.map((f) => (
            <details key={f.q} className="group border-b border-rule" data-reveal>
              <summary className="flex min-h-[64px] cursor-pointer list-none items-center justify-between gap-6 py-5 text-[19px] font-medium tracking-tight [&::-webkit-details-marker]:hidden">
                {f.q}
                <span aria-hidden="true" className="text-[24px] text-mist transition-transform duration-300 group-open:rotate-45">+</span>
              </summary>
              <p className="max-w-[760px] pb-6 text-[16px] leading-relaxed text-white/75">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Request */}
      <section id="request" className="wrap scroll-mt-24 pt-28 pb-32">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr]">
          <div data-reveal>
            <p className="eyebrow text-mist">Request a review</p>
            <h2 className="display mt-4 text-[clamp(36px,5vw,64px)]">Tell us about the lease</h2>
            <p className="mt-5 text-[16px] leading-relaxed text-white/75">
              We'll call within {REVIEW.responseTime} to agree scope and the fixed fee. You don't pay anything until then.
            </p>
            <p className="mt-6 text-[15px] leading-relaxed text-white/75">
              Prefer email? <a href="mailto:info@hmoprofit.co.uk?subject=Provider%20review" className="underline underline-offset-4">info@hmoprofit.co.uk</a>
            </p>
          </div>
          <div data-reveal>
            <RequestForm />
          </div>
        </div>
      </section>
    </div>
  );
}
