import { useEffect, useLayoutEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { NumberField, Segmented, SelectField, StatusBadge } from '../components/Form';
import { calcAll, DEFAULT_INPUTS, gbp, monthlyMortgage, type EpcBand, type Inputs, type Result, type Strategy } from '../lib/calc';
import { gsap, prefersReducedMotion } from '../lib/motion';
import { REPORT_PRICE, stripeUrl, submitLead } from '../lib/lead';
import { readFlag, setFlag, useStored } from '../lib/store';
import { usePageMeta } from '../lib/meta';

const STEPS = ['Property', 'Income', 'Compliance', 'Result'] as const;

function Panel({ title, sub, children }: { title: string; sub?: string; children: ReactNode }) {
  return (
    <section className="rounded-[8px] border border-rule bg-panel p-6 sm:p-8">
      <h2 className="text-[22px] font-medium tracking-tight">{title}</h2>
      {sub && <p className="mt-1 text-[14px] text-mist">{sub}</p>}
      <div className="mt-6 grid gap-5 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Wide({ children }: { children: ReactNode }) {
  return <div className="sm:col-span-2">{children}</div>;
}

function StepProperty({ i, set }: { i: Inputs; set: (p: Partial<Inputs>) => void }) {
  const loan = Math.max(0, i.purchasePrice - i.deposit);
  const pay = monthlyMortgage(loan, i.ratePct, i.termYears, i.mortgageType);
  const ltv = i.purchasePrice > 0 ? (loan / i.purchasePrice) * 100 : 0;
  return (
    <div className="grid gap-4">
      <Panel title="The property" sub="Start with what you're buying or already hold.">
        <Wide>
          <Segmented
            label="Do you own it or lease it?"
            value={i.tenure}
            onChange={(tenure) => set({ tenure })}
            options={[
              { value: 'own', label: 'I own it, or will', sub: 'Mortgage-based' },
              { value: 'lease', label: "I'm leasing it", sub: 'Rent-to-rent' },
            ]}
          />
        </Wide>
        <NumberField label="Bedrooms to let" value={i.bedrooms} onChange={(bedrooms) => set({ bedrooms: Math.max(1, Math.round(bedrooms)) })} hint="One person per room assumed. Five or more means mandatory licensing." />
        {i.tenure === 'lease' && (
          <NumberField label="Rent you pay the owner" value={i.landlordRent} onChange={(landlordRent) => set({ landlordRent })} prefix="£" suffix="/mo" />
        )}
      </Panel>
      {i.tenure === 'own' && (
        <Panel title="Mortgage and finance" sub="Use your actual rate where you have one.">
          <NumberField label="Purchase price" value={i.purchasePrice} onChange={(purchasePrice) => set({ purchasePrice })} prefix="£" step={1000} />
          <NumberField
            label="Deposit"
            value={i.deposit}
            onChange={(deposit) => set({ deposit })}
            prefix="£"
            step={1000}
            hint={`${i.purchasePrice ? ((i.deposit / i.purchasePrice) * 100).toFixed(1) : '0'}% of the price. HMO lenders usually want 25%.`}
          />
          <NumberField label="Interest rate" value={i.ratePct} onChange={(ratePct) => set({ ratePct })} suffix="%" step={0.05} />
          <NumberField label="Term" value={i.termYears} onChange={(termYears) => set({ termYears: Math.max(1, termYears) })} suffix="yrs" />
          <Wide>
            <Segmented
              label="Mortgage type"
              value={i.mortgageType}
              onChange={(mortgageType) => set({ mortgageType })}
              options={[
                { value: 'io', label: 'Interest only', sub: 'Most common for HMOs' },
                { value: 'repayment', label: 'Repayment', sub: 'Capital and interest' },
              ]}
            />
          </Wide>
          <Wide>
            <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-[6px] bg-rule">
              {[
                ['Monthly payment', gbp(pay)],
                ['Loan', gbp(loan)],
                ['Loan to value', `${ltv.toFixed(1)}%`],
              ].map(([k, v]) => (
                <div key={k} className="bg-panel-2 p-4">
                  <dt className="text-[12px] text-mist">{k}</dt>
                  <dd className="num mt-1 text-[20px]">{v}</dd>
                </div>
              ))}
            </dl>
          </Wide>
        </Panel>
      )}
    </div>
  );
}

function StepIncome({ i, set }: { i: Inputs; set: (p: Partial<Inputs>) => void }) {
  return (
    <div className="grid gap-4">
      <Panel title="As an HMO" sub="Room-by-room lets, bills included.">
        <NumberField label="Rent per room" value={i.roomRent} onChange={(roomRent) => set({ roomRent })} prefix="£" suffix="/mo" hint="All-inclusive room rent for the area." />
        <NumberField label="Bills per room" value={i.billsPerRoom} onChange={(billsPerRoom) => set({ billsPerRoom })} prefix="£" suffix="/mo" hint="Energy, water, broadband, council tax, TV licence." />
        <NumberField label="Management fee" value={i.managementPct} onChange={(managementPct) => set({ managementPct })} suffix="%" hint="Set 0 if you self-manage." />
      </Panel>
      <Panel title="As serviced accommodation" sub="The whole house let by the night.">
        <NumberField label="Average nightly rate" value={i.nightlyRate} onChange={(nightlyRate) => set({ nightlyRate })} prefix="£" />
        <NumberField label="Year-round occupancy" value={i.occupancyPct} onChange={(occupancyPct) => set({ occupancyPct: Math.min(100, occupancyPct) })} suffix="%" hint="Most projections assume 80%. Use a full-year figure." />
        <NumberField label="Average stay" value={i.avgStayNights} onChange={(avgStayNights) => set({ avgStayNights: Math.max(1, avgStayNights) })} suffix="nights" />
      </Panel>
      <Panel title="Leased to a supported housing provider" sub="What a provider has offered, or might.">
        <NumberField label="Lease rent offered" value={i.providerLease} onChange={(providerLease) => set({ providerLease })} prefix="£" suffix="/mo" />
        <NumberField label="Lease length" value={i.leaseYears} onChange={(leaseYears) => set({ leaseYears: Math.max(1, leaseYears) })} suffix="yrs" />
      </Panel>
    </div>
  );
}

const EPC_OPTIONS: { value: EpcBand; label: string }[] = [
  { value: 'unknown', label: "Don't know" },
  ...(['A', 'B', 'C', 'D', 'E', 'F', 'G'] as const).map((b) => ({ value: b, label: `Band ${b}` })),
];

function StepCompliance({ i, set }: { i: Inputs; set: (p: Partial<Inputs>) => void }) {
  return (
    <div className="grid gap-4">
      <Panel title="The rules" sub="What the council and the 2030 deadline will ask.">
        <SelectField label="Current EPC rating" value={i.epcBand} onChange={(epcBand) => set({ epcBand })} options={EPC_OPTIONS} hint="C is required for all private lets by 1 October 2030." />
        <Segmented
          label="Article 4 direction for HMOs?"
          value={i.article4}
          onChange={(article4) => set({ article4 })}
          options={[
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
            { value: 'unknown', label: 'Not sure' },
          ]}
        />
        <Wide>
          <Segmented
            label="Is every bedroom at least 6.51 m²?"
            value={i.roomsMeetSize ? 'yes' : 'no'}
            onChange={(v) => set({ roomsMeetSize: v === 'yes' })}
            options={[
              { value: 'yes', label: 'Yes, all of them' },
              { value: 'no', label: 'No, or not measured' },
            ]}
            hint="The national minimum for a room let to one adult in a licensed HMO."
          />
        </Wide>
        <NumberField label="HMO licence fee" value={i.licenceFee} onChange={(licenceFee) => set({ licenceFee })} prefix="£" hint="Total for the licence term. Check your council's fee schedule." />
        <NumberField label="Insurance" value={i.insurance} onChange={(insurance) => set({ insurance })} prefix="£" suffix="/mo" />
      </Panel>
      <Panel title="Serviced accommodation running costs">
        <NumberField label="Cleaning per stay" value={i.cleanPerStay} onChange={(cleanPerStay) => set({ cleanPerStay })} prefix="£" />
        <NumberField label="Platform fees" value={i.platformPct} onChange={(platformPct) => set({ platformPct })} suffix="%" />
        <NumberField label="Bills, rates and consumables" value={i.saFixedCosts} onChange={(saFixedCosts) => set({ saFixedCosts })} prefix="£" suffix="/mo" />
      </Panel>
    </div>
  );
}

function Bar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10" aria-hidden="true">
      <div className="h-full rounded-full bg-signal transition-[width] duration-700" style={{ width: `${pct}%` }} />
    </div>
  );
}

function LeadGate({ onUnlocked, results }: { onUnlocked: (email: string) => void; results: Record<Strategy, Result> }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get('email') ?? '');
    setBusy(true);
    setError(null);
    const res = await submitLead({
      name: String(f.get('name') ?? ''),
      email,
      phone: String(f.get('phone') ?? ''),
      consent: f.get('consent') === 'on',
      company: String(f.get('company') ?? ''),
      source: 'deal-check',
      summary: {
        hmo_compliant: results.hmo.compliant,
        sa_compliant: results.sa.compliant,
        sh_compliant: results.sh.compliant,
      },
    });
    setBusy(false);
    if (res.ok) onUnlocked(email);
    else setError(res.error ?? 'Something went wrong.');
  };
  return (
    <form onSubmit={submit} className="rounded-[8px] border border-white/15 bg-[#0b0c0d]/95 p-6 shadow-2xl backdrop-blur sm:p-8">
      <h3 className="text-[22px] font-medium tracking-tight">See the line-by-line breakdown</h3>
      <p className="mt-1 text-[14px] leading-relaxed text-white/75">Every cost, its basis, and your compliance checklist for all three strategies. Free.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="lead-name" className="mb-2 block text-[14px] font-medium">Name</label>
          <input id="lead-name" name="name" required autoComplete="name" className="field" />
        </div>
        <div>
          <label htmlFor="lead-email" className="mb-2 block text-[14px] font-medium">Email</label>
          <input id="lead-email" name="email" type="email" required autoComplete="email" className="field" />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="lead-phone" className="mb-2 block text-[14px] font-medium">Phone <span className="text-mist">(optional)</span></label>
          <input id="lead-phone" name="phone" type="tel" autoComplete="tel" className="field" />
        </div>
        <div className="hidden" aria-hidden="true">
          <label htmlFor="lead-company">Company</label>
          <input id="lead-company" name="company" tabIndex={-1} autoComplete="off" />
        </div>
        <label className="flex items-start gap-3 text-[13px] leading-relaxed text-white/80 sm:col-span-2">
          <input type="checkbox" name="consent" required className="mt-1 h-4 w-4 accent-[#1E6EF3]" />
          <span>
            Email me my results and related property updates. Unsubscribe any time. See the{' '}
            <Link to="/privacy-policy" className="underline">privacy policy</Link>.
          </span>
        </label>
      </div>
      {error && <p role="alert" className="mt-4 text-[14px] text-risk">{error}</p>}
      <button type="submit" disabled={busy} className="btn btn-signal mt-5 w-full disabled:opacity-60">
        {busy ? 'Unlocking…' : 'Unlock the breakdown'}
      </button>
    </form>
  );
}

function nextSteps(i: Inputs, s: Strategy) {
  const out: { tag: string; title: string; text: string; href: string; internal?: boolean }[] = [];
  if (s === 'sh') {
    out.push(
      { tag: 'Before you sign', title: 'Run the provider lease check', text: 'Twelve questions to put to any supported housing provider.', href: '/provider-check', internal: true },
      { tag: 'For the provider', title: 'Support Audit', text: 'Point them here to evidence their support before licensing arrives.', href: 'https://supportaudit.co.uk' },
      { tag: 'Guides', title: 'Exempt Accommodation', text: 'How exempt rent and provider leases work.', href: 'https://exemptaccommodation.com' },
    );
  }
  if (s !== 'sa' && ['D', 'E', 'F', 'G', 'unknown'].includes(i.epcBand) && i.tenure === 'own') {
    out.push({ tag: 'EPC below C', title: 'Get a current EPC', text: 'Know the real upgrade bill before you commit.', href: 'https://epcbirmingham.co.uk' });
  }
  if (s !== 'sa') {
    out.push({ tag: 'Guide', title: 'The landlord register', text: 'What it costs an HMO, and the deadline for your region.', href: '/guides/register-your-rental-property-hmo' });
  }
  return out;
}

function ResultView({ i, onEdit }: { i: Inputs; onEdit: () => void }) {
  const results = useMemo(() => calcAll(i), [i]);
  const [tab, setTab] = useState<Strategy>('hmo');
  const [unlocked, setUnlocked] = useState(() => readFlag('hp-lead'));
  const [email, setEmail] = useState<string | undefined>();
  const r = results[tab];
  const max = Math.max(...Object.values(results).map((x) => x.headline), 1);
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (prefersReducedMotion() || !ref.current) return;
    const ctx = gsap.context(() => {
      gsap.from('[data-in]', { y: 24, autoAlpha: 0, duration: 0.9, ease: 'expo', stagger: 0.06 });
    }, ref);
    return () => ctx.revert();
  }, [tab]);

  const pay = stripeUrl(email);
  const summary =
    i.tenure === 'own'
      ? `${i.bedrooms}-bed · ${gbp(i.purchasePrice)} · ${((i.deposit / Math.max(1, i.purchasePrice)) * 100).toFixed(0)}% deposit · ${i.ratePct}% ${i.mortgageType === 'io' ? 'interest-only' : 'repayment'}`
      : `${i.bedrooms}-bed · leased at ${gbp(i.landlordRent)}/mo`;

  return (
    <div ref={ref}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-mist">{summary}</p>
          <h1 className="display mt-3 text-[clamp(40px,6vw,76px)]">Your viability report</h1>
        </div>
        <button type="button" onClick={onEdit} className="btn btn-ghost no-print">Edit figures</button>
      </div>

      <div role="tablist" aria-label="Strategy" className="mt-10 grid gap-3 md:grid-cols-3">
        {(Object.keys(results) as Strategy[]).map((k) => {
          const x = results[k];
          const on = k === tab;
          return (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setTab(k)}
              className={`rounded-[8px] border p-5 text-left transition-colors ${on ? 'border-signal bg-signal text-white' : 'border-rule bg-panel hover:border-slate'}`}
            >
              <span className="flex items-center justify-between gap-2 text-[15px] font-medium">
                {x.name}
                {x.flag && <span className="eyebrow rounded bg-warn px-1.5 py-0.5 !text-[10px] text-black">Provider risk</span>}
              </span>
              <span className="num mt-3 block text-[34px] leading-none">{gbp(x.compliant)}<span className="text-[15px] opacity-75">/mo</span></span>
              <span className={`mt-1 block text-[13px] ${on ? 'text-white/85' : 'text-mist'}`}>
                Compliant profit · headline <s>{gbp(x.headline)}</s>
              </span>
              <span className="mt-4 block"><Bar value={x.compliant} max={max} /></span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 grid gap-px overflow-hidden rounded-[8px] border border-rule bg-rule sm:grid-cols-3" data-in>
        <div className="bg-panel p-6">
          <p className="text-[14px] text-mist">Headline profit</p>
          <p className="num mt-2 text-[32px] text-white/70">{gbp(r.headline)}</p>
        </div>
        <div className="bg-panel p-6">
          <p className="text-[14px] text-mist">Compliance load</p>
          <p className="num mt-2 text-[32px] text-risk">{gbp(-r.load)}</p>
        </div>
        <div className="bg-white p-6 text-black">
          <p className="text-[14px] text-black/70">Compliant profit</p>
          <p className="num mt-1 text-[44px] leading-tight">{gbp(r.compliant)}</p>
          <p className="text-[13px] text-black/70">{gbp(r.stress)} {r.stressLabel}</p>
        </div>
      </div>

      {r.flag && (
        <div className="mt-4 flex gap-3 rounded-[8px] bg-warn p-5 text-black" data-in>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="mt-0.5 shrink-0"><path d="M12 3 2 21h20z" /><path d="M12 10v5M12 18v.5" /></svg>
          <p className="text-[15px] leading-relaxed">{r.flag}</p>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="relative">
          <div className={unlocked ? '' : 'pointer-events-none select-none blur-[6px]'} aria-hidden={!unlocked}>
            <section className="rounded-[8px] border border-rule bg-panel" data-in>
              <h2 className="border-b border-rule px-6 py-4 text-[17px] font-medium">Where the money goes, per month</h2>
              <ul>
                {r.lines.map((l) => (
                  <li key={l.label} className="flex items-baseline justify-between gap-4 border-b border-rule/60 px-6 py-4 last:border-0">
                    <div className="min-w-0">
                      <p className="text-[15px] font-medium">{l.label}</p>
                      <p className="mt-0.5 text-[13px] text-mist">{l.basis}</p>
                    </div>
                    <span className="num shrink-0 text-[16px] text-risk">{gbp(-l.amount)}</span>
                  </li>
                ))}
              </ul>
            </section>
            <section className="mt-4 rounded-[8px] border border-rule bg-panel" data-in>
              <h2 className="border-b border-rule px-6 py-4 text-[17px] font-medium">Compliance checklist</h2>
              <ul>
                {r.checks.map((c) => (
                  <li key={c.label} className="flex gap-4 border-b border-rule/60 px-6 py-4 last:border-0">
                    <StatusBadge status={c.status} />
                    <div className="min-w-0">
                      <p className="text-[15px] font-medium">{c.label}</p>
                      <p className="mt-0.5 text-[13px] leading-relaxed text-mist">{c.note}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>
          {!unlocked && (
            <div className="absolute inset-0 flex items-start justify-center p-3 pt-10 sm:p-8">
              <div className="w-full max-w-[520px]">
                <LeadGate
                  results={results}
                  onUnlocked={(e) => {
                    setFlag('hp-lead');
                    setEmail(e);
                    setUnlocked(true);
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <aside className="flex flex-col gap-4">
          <div className="ticks rounded-[8px] bg-signal p-6 text-white" data-in>
            <h2 className="text-[22px] font-medium tracking-tight">What to do next</h2>
            <div className="mt-4 grid gap-2.5">
              {nextSteps(i, tab).map((n) => {
                const inner = (
                  <>
                    <span className="eyebrow !text-[10px] text-black/60">{n.tag}</span>
                    <span className="mt-1 block text-[16px] font-medium">{n.title}</span>
                    <span className="mt-0.5 block text-[13px] leading-snug text-black/70">{n.text}</span>
                  </>
                );
                const cls = 'block rounded-[6px] bg-white p-4 text-black transition-transform hover:-translate-y-0.5';
                return n.internal ? (
                  <Link key={n.title} to={n.href} className={cls}>{inner}</Link>
                ) : (
                  <a key={n.title} href={n.href} className={cls}>{inner}</a>
                );
              })}
            </div>
          </div>
          <div className="rounded-[8px] border border-rule bg-panel p-6" data-in>
            <h2 className="text-[20px] font-medium tracking-tight">Full report · {REPORT_PRICE}</h2>
            <p className="mt-2 text-[14px] leading-relaxed text-white/75">
              All three strategies on one printable page, every assumption listed, ready for your broker or investor.
            </p>
            {pay ? (
              <a href={pay} className="btn btn-light mt-5 w-full">Get the full report</a>
            ) : (
              <Link to="/report" className="btn btn-light mt-5 w-full">Get the full report</Link>
            )}
            <p className="mt-3 text-[12px] text-mist">Secure payment by Stripe.</p>
          </div>
        </aside>
      </div>

      <p className="mt-10 max-w-[820px] text-[13px] leading-relaxed text-mist">
        Illustrative estimates from the figures entered. Not financial, investment, tax or legal advice. Rules shown apply to England.
        Check licensing and Article 4 with your council before you commit.
      </p>
    </div>
  );
}

export default function Check() {
  usePageMeta('Deal check | HMO Profit', 'Compare HMO, serviced accommodation and a provider lease on the profit left after licensing, the landlord register and EPC C by 2030.');
  const [inputs, setInputs] = useStored<Inputs>('hp-inputs', DEFAULT_INPUTS);
  const [params, setParams] = useSearchParams();
  const [step, setStep] = useState(() => (params.get('step') === 'result' ? 3 : 0));
  const set = (p: Partial<Inputs>) => setInputs((prev) => ({ ...prev, ...p }));
  const body = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (step === 3) setParams({ step: 'result' }, { replace: true });
    else if (params.get('step')) setParams({}, { replace: true });
    window.scrollTo({ top: 0 });
    if (!prefersReducedMotion() && body.current) {
      gsap.fromTo(body.current, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'expo' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  return (
    <div className="wrap pt-14 pb-28">
      {step < 3 && (
        <>
          <p className="eyebrow text-mist">Deal check · about two minutes</p>
          <h1 className="display mt-3 text-[clamp(40px,6vw,76px)]">{['Your property', 'What it could earn', 'The rules and costs'][step]}</h1>
        </>
      )}
      <ol aria-label="Progress" className="no-print mt-8 grid grid-cols-4 gap-2">
        {STEPS.map((s, n) => (
          <li key={s}>
            <button
              type="button"
              onClick={() => n <= step && setStep(n)}
              disabled={n > step}
              aria-current={n === step ? 'step' : undefined}
              className="w-full text-left disabled:cursor-default"
            >
              <span className={`block h-1 rounded-full transition-colors duration-500 ${n <= step ? 'bg-signal' : 'bg-white/12'}`} />
              <span className={`eyebrow mt-2.5 block !text-[11px] ${n === step ? 'text-white' : 'text-mist'}`}>
                {n + 1} {s}
              </span>
            </button>
          </li>
        ))}
      </ol>

      <div ref={body} className="mt-10">
        {step === 0 && <StepProperty i={inputs} set={set} />}
        {step === 1 && <StepIncome i={inputs} set={set} />}
        {step === 2 && <StepCompliance i={inputs} set={set} />}
        {step === 3 && <ResultView i={inputs} onEdit={() => setStep(0)} />}
      </div>

      {step < 3 && (
        <div className="no-print mt-8 flex flex-wrap justify-between gap-3">
          <button type="button" className="btn btn-ghost" onClick={() => (step === 0 ? setInputs(DEFAULT_INPUTS) : setStep(step - 1))}>
            {step === 0 ? 'Reset to sample deal' : 'Back'}
          </button>
          <button type="button" className="btn btn-signal min-w-[200px]" onClick={() => setStep(step + 1)}>
            {step === 2 ? 'See my result' : `Next: ${STEPS[step + 1]}`}
          </button>
        </div>
      )}
    </div>
  );
}
