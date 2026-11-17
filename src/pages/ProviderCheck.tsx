import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStored } from '../lib/store';
import LeadForm from '../components/LeadForm';
import { readProfile, type LeadProfile } from '../lib/lead';
import { SITES } from '../lib/network';
import { setupReveals } from '../lib/motion';
import { usePageMeta } from '../lib/meta';

type Answer = 'yes' | 'unsure' | 'no';

const GROUPS: { title: string; qs: { id: string; q: string; ask: string }[] }[] = [
  {
    title: 'Who they are',
    qs: [
      { id: 'rp', q: 'Are they a registered provider, or do they lease through one?', ask: 'Ask for their registration number or the name of the RP they work with.' },
      { id: 'councils', q: 'Do they already operate with your council, and for how long?', ask: 'Ask which councils refer to them and since when.' },
      { id: 'refs', q: 'Will they put you in touch with two landlords they lease from now?', ask: 'Speak to existing landlords before you sign.' },
      { id: 'licence', q: 'Do they have a plan for supported housing licensing?', ask: 'Ask how they will meet licence conditions when the council scheme starts.' },
    ],
  },
  {
    title: 'The support',
    qs: [
      { id: 'who', q: 'Can they say who delivers support day to day, and for how many hours?', ask: 'Ask for named roles and planned hours per resident.' },
      { id: 'plans', q: 'Can they show an anonymised support plan and review record?', ask: 'A real provider can show the paperwork without breaching privacy.' },
      { id: 'audit', q: 'Has their support or property evidence been independently audited?', ask: 'Ask for the date and scope of the last independent audit.' },
      { id: 'referrals', q: 'Do they have a clear referral route?', ask: 'Council, probation, mental health services: who sends residents?' },
    ],
  },
  {
    title: 'The lease',
    qs: [
      { id: 'hb', q: 'Does the lease say what happens if Housing Benefit is cut or stopped?', ask: 'Your rent should not silently depend on their claim.' },
      { id: 'break', q: 'Are the notice period and break clause acceptable to you?', ask: 'Look for short-notice hand-backs.' },
      { id: 'repairs', q: 'Is it clear who holds repair, compliance and fire safety liability?', ask: 'Get it written into the lease.' },
      { id: 'dilaps', q: 'Is the hand-back condition defined?', ask: 'Define the condition and a schedule of dilapidations.' },
    ],
  },
];
const ALL = GROUPS.flatMap((g) => g.qs);

function verdict(score: number, answered: number) {
  if (answered < ALL.length) return { title: `${answered} of ${ALL.length} answered`, text: 'Answer every question to see the verdict.', tone: 'bg-panel-2 text-white' };
  if (score >= 20) return { title: 'Strong position', text: 'Good answers across the board. Still have a solicitor review the lease.', tone: 'bg-ok text-black' };
  if (score >= 12) return { title: 'Gaps to close first', text: 'Get written answers on every amber or red item before you sign.', tone: 'bg-warn text-black' };
  return { title: "Don't sign yet", text: 'Too much is unknown. The rent behind this lease may not hold.', tone: 'bg-risk text-black' };
}

export default function ProviderCheck() {
  usePageMeta(
    'Provider lease check | HMO Profit',
    'Offered a lease by a supported housing provider? Twelve questions to ask before you sign, with a scorecard you can take to your solicitor.',
  );
  const [answers, setAnswers] = useStored<Record<string, Answer>>('hp-provider', {});
  const [profile, setProfile] = useState<LeadProfile | null>(() => readProfile());
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => (ref.current ? setupReveals(ref.current) : undefined), []);

  const { score, answered } = useMemo(() => {
    let s = 0;
    let a = 0;
    for (const q of ALL) {
      const v = answers[q.id];
      if (!v) continue;
      a++;
      s += v === 'yes' ? 2 : v === 'unsure' ? 1 : 0;
    }
    return { score: s, answered: a };
  }, [answers]);
  const v = verdict(score, answered);
  const gaps = ALL.filter((q) => answers[q.id] && answers[q.id] !== 'yes');

  return (
    <div ref={ref}>
      <section className="wrap pt-20 pb-16">
        <p className="eyebrow text-mist">Provider lease check · free</p>
        <h1 data-split className="display mt-4 max-w-[18ch] text-[clamp(42px,7vw,104px)]">
          Offered a provider lease? Check them before you sign.
        </h1>
        <p className="mt-6 max-w-[680px] text-[18px] leading-relaxed text-white/80" data-reveal>
          In exempt accommodation your rent comes from Housing Benefit paid to the provider. If their support doesn't stand up, the
          money behind your lease can stop — and local licensing is on its way.
        </p>
      </section>

      <section className="grid border-y border-rule md:grid-cols-3">
        {[
          ['The rent depends on the support', 'Exempt rent is only paid where care, support or supervision is genuinely provided.'],
          ['Licensing is coming locally', 'The Supported Housing (Regulatory Oversight) Act lets councils license exempt accommodation.'],
          ['The property is still yours', "HMO licensing, fire safety and the building's condition don't transfer with the lease."],
        ].map(([t, d], n) => (
          <div key={t} data-reveal className={`p-8 ${n === 0 ? 'bg-signal' : ''} ${n > 0 ? 'border-t border-rule md:border-t-0 md:border-l' : ''}`}>
            <h2 className="text-[21px] font-medium tracking-tight">{t}</h2>
            <p className={`mt-2 text-[15px] leading-relaxed ${n === 0 ? 'text-white/90' : 'text-white/70'}`}>{d}</p>
          </div>
        ))}
      </section>

      <div className="wrap grid gap-10 pt-20 pb-28 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-10">
          {GROUPS.map((g) => (
            <fieldset key={g.title} data-reveal>
              <legend className="text-[28px] font-medium tracking-tight">{g.title}</legend>
              <ol className="mt-4 space-y-3">
                {g.qs.map((q) => {
                  const idx = ALL.indexOf(q) + 1;
                  return (
                    <li key={q.id} className="rounded-[8px] border border-rule bg-panel p-5">
                      <p id={`q-${q.id}`} className="flex gap-3 text-[15px] leading-relaxed">
                        <span className="num text-mist">{String(idx).padStart(2, '0')}</span>
                        {q.q}
                      </p>
                      <div role="radiogroup" aria-labelledby={`q-${q.id}`} className="mt-4 grid grid-cols-3 gap-2 pl-0 sm:pl-8">
                        {(['yes', 'unsure', 'no'] as Answer[]).map((a) => {
                          const on = answers[q.id] === a;
                          const tone = a === 'yes' ? 'border-ok bg-ok/15' : a === 'unsure' ? 'border-warn bg-warn/15' : 'border-risk bg-risk/15';
                          return (
                            <label key={a} className={`flex min-h-[44px] cursor-pointer items-center justify-center rounded-[6px] border text-[14px] font-medium transition-colors ${on ? tone : 'border-rule hover:border-slate'}`}>
                              <input type="radio" name={q.id} className="sr-only" checked={on} onChange={() => setAnswers((p) => ({ ...p, [q.id]: a }))} />
                              {a === 'yes' ? 'Yes' : a === 'unsure' ? 'Not sure' : 'No'}
                            </label>
                          );
                        })}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </fieldset>
          ))}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className={`rounded-[8px] p-6 transition-colors duration-500 ${v.tone}`} aria-live="polite">
            <p className="eyebrow opacity-70">Scorecard</p>
            <p className="num mt-2 text-[56px] leading-none">{score}<span className="text-[22px] opacity-60">/{ALL.length * 2}</span></p>
            <p className="mt-3 text-[20px] font-medium">{v.title}</p>
            <p className="mt-1 text-[14px] leading-relaxed opacity-85">{v.text}</p>
          </div>
          {gaps.length > 0 && (
            <div className="mt-4 rounded-[8px] border border-rule bg-panel p-6">
              <h2 className="text-[17px] font-medium">Get these in writing</h2>
              <ul className="mt-3 space-y-3 text-[14px] leading-relaxed text-white/80">
                {gaps.map((q) => (
                  <li key={q.id} className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 bg-warn" aria-hidden="true" />{q.ask}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-4">
            {profile ? (
              <p className="rounded-[8px] border border-rule bg-panel p-5 text-[14px] leading-relaxed text-white/80">
                Thanks{profile.name ? `, ${profile.name.split(' ')[0]}` : ''}. We'll send supported housing licensing updates as the
                rules firm up. Print the scorecard below to take to your solicitor.
              </p>
            ) : (
              answered >= 6 && (
                <LeadForm
                  source="provider-check"
                  title="Stay ahead of licensing"
                  text="Get supported housing licensing updates as the regulations firm up, and a call if you'd like a second pair of eyes on this provider."
                  button="Send me updates"
                  summary={{ provider_score: score, provider_answered: answered, provider_gaps: gaps.map((g) => g.id).join(' ') }}
                  onDone={setProfile}
                />
              )
            )}
          </div>
          <div className="mt-4 grid gap-3">
            <a href={SITES.supportAudit.href} className="ticks block rounded-[8px] bg-signal p-6 text-white transition-transform hover:-translate-y-0.5">
              <span className="eyebrow text-white/80">If you're the provider</span>
              <span className="mt-2 block text-[24px] font-medium tracking-tight">Support Audit</span>
              <span className="mt-1 block text-[14px] leading-relaxed text-white/90">An independent check that your property and support evidence stands up.</span>
            </a>
            <a href={SITES.exempt.href} className="block rounded-[8px] border border-rule bg-panel p-6 transition-colors hover:border-white">
              <span className="eyebrow text-mist">If you're the owner</span>
              <span className="mt-2 block text-[24px] font-medium tracking-tight">Exempt Accommodation</span>
              <span className="mt-1 block text-[14px] leading-relaxed text-white/75">Guides to exempt rent, provider leases and licensing.</span>
            </a>
            <Link to="/check" className="btn btn-light">Model the lease figures</Link>
            <button type="button" className="btn btn-ghost" onClick={() => window.print()}>Print scorecard</button>
          </div>
        </aside>
      </div>
      <p className="wrap pb-20 text-[13px] text-mist">General information for England, not legal advice. Have a solicitor review any lease before you sign.</p>
    </div>
  );
}
