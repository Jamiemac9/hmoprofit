import { useLayoutEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { HeroField, BarsField } from '../components/Fields';
import { SceneHeadline, SceneLoad, SceneCompliant, MiniHmo, MiniSa, MiniSh } from '../components/Iso';
import { calcHmo, DEFAULT_INPUTS, gbp } from '../lib/calc';
import { gsap, setupReveals, prefersReducedMotion } from '../lib/motion';
import { usePageMeta } from '../lib/meta';

function useReveals() {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => (ref.current ? setupReveals(ref.current) : undefined), []);
  return ref;
}

function Hero() {
  const ref = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    if (prefersReducedMotion() || !ref.current) return;
    const ctx = gsap.context(() => {
      gsap.from('[data-hero-in]', { y: 30, autoAlpha: 0, duration: 1.2, ease: 'expo', stagger: 0.1, delay: 0.5 });
    }, ref);
    return () => ctx.revert();
  }, []);
  return (
    <section ref={ref} className="relative -mt-[66px] flex min-h-[100svh] items-end overflow-hidden pb-[9vh]">
      <HeroField className="absolute inset-0 h-full w-full" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black via-black/70 to-transparent" />
      <div className="wrap relative text-center">
        <p data-hero-in className="eyebrow mb-6 text-mist">Free deal check · England</p>
        <h1 data-split className="display mx-auto max-w-[15ch] text-[clamp(46px,8.2vw,124px)]">
          Compliant profit, not headline yield.
        </h1>
        <p data-hero-in className="mx-auto mt-6 max-w-[620px] text-[clamp(16px,1.6vw,19px)] leading-relaxed text-white/80">
          Run a property through the rules that decide the deal — licensing, Article 4, the Renters' Rights Act, the landlord
          register, EPC C by 2030 and supported housing licensing — and see what's left.
        </p>
        <div data-hero-in className="mt-9 flex flex-wrap justify-center gap-3">
          <Link to="/check" className="btn btn-signal">Check a deal</Link>
          <Link to="/provider-check" className="btn btn-light">Check a provider</Link>
        </div>
      </div>
    </section>
  );
}

function PinnedStory() {
  const r = useMemo(() => calcHmo(DEFAULT_INPUTS), []);
  const steps = [
    {
      label: 'Headline profit',
      value: `${gbp(r.headline)}/mo`,
      text: "What the deal looks like on a sourcer's spreadsheet: rent minus mortgage, bills and management.",
      Art: SceneHeadline,
    },
    {
      label: 'Compliance load',
      value: `${gbp(-r.load)}/mo`,
      text: 'Licensing, the landlord register, voids under periodic tenancies, maintenance and the EPC C upgrade — each costed per month.',
      Art: SceneLoad,
    },
    {
      label: 'Compliant profit',
      value: `${gbp(r.compliant)}/mo`,
      text: `What's left once the house would pass an inspection. ${gbp(r.stress)} ${r.stressLabel}.`,
      Art: SceneCompliant,
    },
  ];
  const root = useRef<HTMLElement>(null);
  const reduced = prefersReducedMotion();

  useLayoutEffect(() => {
    if (reduced || !root.current) return;
    const mm = gsap.matchMedia(root);
    mm.add('(min-width: 900px)', () => {
      const texts = gsap.utils.toArray<HTMLElement>('.story-text');
      const arts = gsap.utils.toArray<HTMLElement>('.story-art');
      const dots = gsap.utils.toArray<HTMLElement>('.story-dot');
      gsap.set(texts.slice(1), { autoAlpha: 0, yPercent: 40 });
      gsap.set(arts.slice(1), { autoAlpha: 0, scale: 0.86, y: 30 });
      gsap.set(dots, { width: 8 });
      gsap.set(dots[0], { width: 36 });
      const tl = gsap.timeline({
        defaults: { ease: 'power2.inOut', duration: 1 },
        scrollTrigger: {
          trigger: '.story-stage',
          start: 'center center',
          end: '+=180%',
          pin: true,
          scrub: 0.6,
          snap: { snapTo: [0, 0.5, 1], duration: 0.5, ease: 'power2.inOut' },
        },
      });
      for (let i = 1; i < steps.length; i++) {
        tl.to(texts[i - 1], { autoAlpha: 0, yPercent: -40 })
          .to(arts[i - 1], { autoAlpha: 0, scale: 1.08, y: -30 }, '<')
          .to(texts[i], { autoAlpha: 1, yPercent: 0 }, '<0.25')
          .to(arts[i], { autoAlpha: 1, scale: 1, y: 0 }, '<')
          .to(dots[i - 1], { width: 8 }, '<')
          .to(dots[i], { width: 36 }, '<');
      }
    });
    return () => mm.revert();
  }, [reduced]);

  const intro = (
    <div className="mb-10 max-w-[720px]" data-reveal>
      <p className="eyebrow text-mist">How it works</p>
      <h2 className="display mt-4 text-[clamp(36px,5vw,68px)]">Three numbers, not one.</h2>
      <p className="mt-4 text-[17px] leading-relaxed text-white/75">
        Most calculators stop at rent minus mortgage. Lenders, councils and auditors don't. Every check shows these three side by
        side. Below: a sample 6-bed HMO at £285,000.
      </p>
    </div>
  );

  return (
    <section id="how" ref={root} className="wrap scroll-mt-24 pt-28">
      {intro}
      {/* Desktop: pinned, scroll-scrubbed */}
      {!reduced && (
        <div className="story-stage hidden h-[min(640px,78vh)] grid-cols-2 border border-rule min-[900px]:grid">
          <div className="ticks relative overflow-hidden bg-signal p-10 text-white">
            <p className="eyebrow text-center text-white/85">Sample deal · illustrative</p>
            {steps.map((s) => (
              <div key={s.label} className="story-text absolute inset-x-10 top-1/2 -translate-y-1/2 text-center">
                <p className="text-[19px] text-white/85">{s.label}</p>
                <p className="num mt-2 text-[clamp(56px,6.4vw,96px)] leading-none font-medium">{s.value}</p>
                <p className="mx-auto mt-6 max-w-[420px] text-[16px] leading-relaxed text-white/90">{s.text}</p>
              </div>
            ))}
            <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-white/15 p-2" aria-hidden="true">
              {steps.map((s) => (
                <span key={s.label} className="story-dot block h-2 rounded-full bg-white" />
              ))}
            </div>
          </div>
          <div className="dot-grid relative grid place-items-center border-l border-rule p-10">
            <div className="relative aspect-square w-[78%] max-w-[420px] bg-white">
              {steps.map(({ label, Art }) => (
                <div key={label} className="story-art absolute inset-0 p-6">
                  <Art />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* Mobile and reduced motion: stacked */}
      <div className={`grid gap-4 ${reduced ? '' : 'min-[900px]:hidden'}`}>
        {steps.map(({ label, value, text, Art }) => (
          <div key={label} className="grid overflow-hidden border border-rule sm:grid-cols-2" data-reveal>
            <div className="ticks bg-signal p-8 text-white">
              <p className="text-[17px] text-white/85">{label}</p>
              <p className="num mt-2 text-[48px] leading-none font-medium">{value}</p>
              <p className="mt-4 text-[15px] leading-relaxed text-white/90">{text}</p>
            </div>
            <div className="dot-grid grid place-items-center p-6">
              <div className="aspect-square w-full max-w-[260px] bg-white p-4">
                <Art />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

const strategies = [
  {
    name: 'Professional HMO',
    line: 'Room-by-room lets to working professionals. Steady, and the most regulated of the three.',
    decides: ['Mandatory or additional licensing', 'Article 4 and planning use class', 'Minimum room sizes', "Periodic tenancies under the Renters' Rights Act", 'EPC C by 1 October 2030'],
    Art: MiniHmo,
  },
  {
    name: 'Serviced accommodation',
    line: 'Short stays by the night. A higher top line, much higher running costs and occupancy risk.',
    decides: ['Planning for short-let use', 'Mortgage and insurance that allow it', 'Year-round occupancy, not peak season', 'Cleaning, fees, bills and rates', 'Fire safety for paying guests'],
    Art: MiniSa,
  },
  {
    name: 'Lease to a provider',
    line: 'Not a yield play. Exempt accommodation rent only holds where the support is real and evidenced.',
    decides: ['Who the provider is', 'Whether they will meet local licensing', 'Housing Benefit scrutiny of exempt rent', 'Break clauses and repair liability', "The council's supported housing strategy"],
    Art: MiniSh,
    badge: 'Licensing coming',
  },
];

function Strategies() {
  return (
    <section id="strategies" className="wrap scroll-mt-24 pt-36">
      <div className="max-w-[760px]">
        <p className="eyebrow text-mist" data-reveal>Strategies</p>
        <h2 data-split className="display mt-4 text-[clamp(36px,5vw,68px)]">Same property. Three strategies. Different rules.</h2>
      </div>
      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {strategies.map(({ name, line, decides, Art, badge }) => (
          <article key={name} data-reveal className="group flex flex-col rounded-[6px] bg-panel-2 p-7 transition-transform duration-500 hover:-translate-y-1">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-[28px] leading-tight font-medium tracking-tight">{name}</h3>
              {badge && <span className="eyebrow shrink-0 rounded bg-warn px-2 py-1 !text-[10px] text-black">{badge}</span>}
            </div>
            <div className="my-4 h-[170px]">
              <Art />
            </div>
            <p className="text-[15px] leading-relaxed text-white/75">{line}</p>
            <p className="eyebrow mt-6 text-mist">What decides it</p>
            <ul className="mt-3 space-y-2 text-[14px] text-white/90">
              {decides.map((d) => (
                <li key={d} className="flex gap-2.5">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 bg-signal" aria-hidden="true" />
                  {d}
                </li>
              ))}
            </ul>
            <Link
              to={name === 'Lease to a provider' ? '/provider-check' : '/check'}
              className="mt-auto pt-8 text-[14px] font-medium text-white underline-offset-4 group-hover:underline"
            >
              {name === 'Lease to a provider' ? 'Run the provider check →' : 'Check this strategy →'}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

const dates = [
  { when: '1 May 2026', what: "Renters' Rights Act in force: section 21 gone, periodic tenancies", tone: 'bg-signal text-white' },
  { when: '15 Dec 2026', what: 'Landlord register opens in the West Midlands, £65 a property a year', tone: 'bg-ink text-white border border-rule' },
  { when: '2027', what: 'Supported housing reforms start; councils publish supported housing strategies', tone: 'bg-slate text-white' },
  { when: '1 Oct 2030', what: 'EPC C minimum for all private lets. Short-term lets are outside it', tone: 'bg-white text-black' },
];

function RuleDates() {
  return (
    <section id="rules" className="mt-36 scroll-mt-24">
      <div className="wrap mb-10 flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-[640px]">
          <p className="eyebrow text-mist" data-reveal>Rule changes</p>
          <h2 data-split className="display mt-4 text-[clamp(36px,5vw,68px)]">The dates already in your numbers</h2>
        </div>
        <p className="max-w-[360px] text-[15px] leading-relaxed text-white/70" data-reveal>
          Every check is dated against these. When a date moves, the calculator moves with it.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4">
        {dates.map((d) => (
          <div key={d.when} data-reveal className={`relative flex min-h-[220px] flex-col justify-between p-6 ${d.tone}`}>
            <span className="absolute top-4 right-4 h-2 w-2 bg-current opacity-80" aria-hidden="true" />
            <p className="num text-[clamp(30px,3vw,44px)] leading-none">{d.when}</p>
            <p className="max-w-[30ch] text-[14px] leading-snug opacity-90">{d.what}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

const uses = [
  { t: 'Before you buy', d: 'Compare HMO, serviced and a provider lease on the same property before an offer goes in.', to: '/check' },
  { t: 'Already a landlord', d: 'Stress-test the houses you own against periodic tenancies, the register and the 2030 EPC deadline.', to: '/check' },
  { t: 'Offered a provider lease', d: 'A supported housing provider wants a five-year lease. Check them before you sign.', to: '/provider-check' },
  { t: 'Running a provider', d: 'Model a new scheme with licensing and repair costs in, not bolted on later.', to: '/check' },
  { t: 'Sourcing deals', d: 'Hand investors a report they can check line by line, not a yield claim.', to: '/check' },
];

function UseCases() {
  return (
    <section className="wrap pt-36">
      <p className="eyebrow text-mist" data-reveal>Who it's for</p>
      <h2 data-split className="display mt-4 max-w-[760px] text-[clamp(36px,5vw,68px)]">Five reasons people run a check</h2>
      <ul className="mt-12 border-t border-rule">
        {uses.map((u, i) => (
          <li key={u.t} data-reveal>
            <Link
              to={u.to}
              className="group grid grid-cols-[40px_1fr] items-baseline gap-x-6 gap-y-1 border-b border-rule px-2 py-7 transition-colors duration-300 hover:bg-signal md:grid-cols-[60px_1fr_1.4fr_40px]"
            >
              <span className="num text-[14px] text-mist group-hover:text-white">0{i + 1}</span>
              <span className="text-[24px] font-medium tracking-tight">{u.t}</span>
              <span className="col-start-2 text-[15px] leading-relaxed text-white/70 group-hover:text-white md:col-start-auto">{u.d}</span>
              <span className="hidden text-right text-[20px] transition-transform duration-300 group-hover:translate-x-1 md:block" aria-hidden="true">→</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

const network = [
  { tag: 'For providers', name: 'Support Audit', d: 'Does your property and support evidence stand up before the council or an RP looks at it?', href: 'https://supportaudit.co.uk' },
  { tag: 'For owners', name: 'Exempt Accommodation', d: 'Plain-English guides to exempt rent, provider leases and the new licensing regime.', href: 'https://exemptaccommodation.com' },
  { tag: 'EPC below C?', name: 'EPC Birmingham', d: 'Get a current assessment and know your upgrade bill before 2030 makes it urgent.', href: 'https://epcbirmingham.co.uk' },
];

function Network() {
  return (
    <section className="wrap pt-36">
      <div className="grid gap-10 md:grid-cols-[1fr_1fr] md:items-end">
        <div>
          <p className="eyebrow text-mist" data-reveal>Part of the SEA network</p>
          <h2 data-split className="display mt-4 text-[clamp(36px,5vw,68px)]">Where a check sends you next</h2>
        </div>
        <p className="max-w-[440px] text-[16px] leading-relaxed text-white/70 md:justify-self-end" data-reveal>
          HMO Profit is the front door. When a check flags something, it points you to the part of the network that deals with it.
        </p>
      </div>
      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {network.map((n) => (
          <a
            key={n.name}
            href={n.href}
            data-reveal
            className="ticks group flex min-h-[260px] flex-col rounded-[6px] border border-rule bg-panel p-8 text-white transition-colors duration-500 hover:border-signal hover:bg-signal"
          >
            <span className="eyebrow text-mist group-hover:text-white/85">{n.tag}</span>
            <span className="mt-4 text-[30px] font-medium tracking-tight">{n.name}</span>
            <span className="mt-3 text-[15px] leading-relaxed text-white/75 group-hover:text-white">{n.d}</span>
            <span className="mt-auto pt-6 text-[14px] font-medium">{n.href.replace('https://', '')} →</span>
          </a>
        ))}
      </div>
    </section>
  );
}

function Ethos() {
  return (
    <section className="relative mt-40 overflow-hidden py-40">
      <BarsField className="absolute inset-0 h-full w-full" />
      <div className="wrap relative text-center">
        <p className="eyebrow text-signal" data-reveal>Why it exists</p>
        <h2 data-split className="display mx-auto mt-5 max-w-[16ch] text-[clamp(40px,6vw,88px)]">
          Built by someone who's had to pass the inspection
        </h2>
        <p className="mx-auto mt-6 max-w-[620px] text-[17px] leading-relaxed text-white/80" data-reveal>
          HMO Profit is built by Jamie Mac: eight years in property and compliance — HMOs, social and supported property — and ten in
          tech. It asks what a council officer or auditor would ask, because that's where deals fall over.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3" data-reveal>
          <Link to="/check" className="btn btn-signal">Check a deal</Link>
          <Link to="/provider-check" className="btn btn-light">Check a provider</Link>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  usePageMeta(
    'HMO Profit | Compliance-adjusted profit for UK property',
    "See the profit a UK property makes after the rules that decide it: licensing, Article 4, the Renters' Rights Act, EPC C by 2030 and supported housing licensing. Free deal check.",
  );
  const ref = useReveals();
  return (
    <div ref={ref}>
      <Hero />
      <PinnedStory />
      <Strategies />
      <RuleDates />
      <UseCases />
      <Network />
      <Ethos />
    </div>
  );
}
