import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { StatusBadge } from '../components/Form';
import { calcAll, DEFAULT_INPUTS, gbp, RULES, type Inputs, type Strategy } from '../lib/calc';
import { REPORT_PRICE, stripeUrl } from '../lib/lead';
import { readFlag, setFlag, useStored } from '../lib/store';
import { usePageMeta } from '../lib/meta';

/**
 * Full report. Stripe's Payment Link should redirect to /report?paid=1 after payment.
 * Unlock is client-side, which matches a low-price digital report; move the check to a
 * Pages Function with Stripe Checkout Sessions if you need server-side verification.
 */
export default function Report() {
  usePageMeta('Full viability report | HMO Profit', 'Your full compliance-adjusted viability report across HMO, serviced accommodation and a provider lease.');
  const [params] = useSearchParams();
  const [inputs] = useStored<Inputs>('hp-inputs', DEFAULT_INPUTS);
  const [paid, setPaid] = useState(() => readFlag('hp-paid'));
  useEffect(() => {
    if (params.get('paid') === '1') {
      setFlag('hp-paid');
      setPaid(true);
    }
  }, [params]);
  const results = useMemo(() => calcAll(inputs), [inputs]);
  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  if (!paid) {
    const pay = stripeUrl();
    return (
      <div className="wrap max-w-[760px] pt-20 pb-32">
        <p className="eyebrow text-mist">Full report · {REPORT_PRICE}</p>
        <h1 className="display mt-3 text-[clamp(40px,6vw,72px)]">One page your broker can check line by line</h1>
        <ul className="mt-8 space-y-3 text-[16px] text-white/85">
          {['All three strategies side by side', 'Every cost with its basis', 'The full compliance checklist', 'Stress test on rate or rent', 'Printable, or save as PDF'].map((x) => (
            <li key={x} className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 shrink-0 bg-signal" aria-hidden="true" />{x}</li>
          ))}
        </ul>
        <div className="mt-10 flex flex-wrap gap-3">
          {pay ? (
            <a href={pay} className="btn btn-signal">Pay {REPORT_PRICE} with Stripe</a>
          ) : (
            <p className="rounded-[6px] border border-rule px-4 py-3 text-[14px] text-mist">Payments are being set up. Email info@hmoprofit.co.uk for a copy.</p>
          )}
          <Link to="/check?step=result" className="btn btn-ghost">Back to my result</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap max-w-[980px] pt-14 pb-28">
      <div className="no-print mb-8 flex flex-wrap justify-between gap-3">
        <Link to="/check?step=result" className="btn btn-ghost">Back to my result</Link>
        <button type="button" className="btn btn-signal" onClick={() => window.print()}>Print or save as PDF</button>
      </div>
      <article className="print-plain rounded-[8px] bg-white p-8 text-black sm:p-12">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-black pb-6">
          <div>
            <p className="eyebrow text-black/60">HMO Profit · Full viability report</p>
            <h1 className="mt-2 text-[36px] font-medium tracking-tight">
              {inputs.bedrooms}-bed {inputs.tenure === 'own' ? `at ${gbp(inputs.purchasePrice)}` : `leased at ${gbp(inputs.landlordRent)}/mo`}
            </h1>
          </div>
          <p className="text-[13px] text-black/60">Prepared {date}</p>
        </header>

        <table className="mt-8 w-full text-left text-[14px]">
          <thead>
            <tr className="border-b border-black/20 text-black/60">
              <th className="py-2 font-medium">Per month</th>
              {(Object.keys(results) as Strategy[]).map((k) => (
                <th key={k} className="py-2 text-right font-medium">{results[k].name}</th>
              ))}
            </tr>
          </thead>
          <tbody className="num">
            {(['headline', 'load', 'compliant', 'stress'] as const).map((row) => (
              <tr key={row} className="border-b border-black/10">
                <td className="py-2.5 font-sans">{{ headline: 'Headline profit', load: 'Compliance load', compliant: 'Compliant profit', stress: 'Stress-tested' }[row]}</td>
                {(Object.keys(results) as Strategy[]).map((k) => (
                  <td key={k} className={`py-2.5 text-right ${row === 'compliant' ? 'font-semibold' : ''}`}>
                    {gbp(row === 'load' ? -results[k].load : results[k][row])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {(Object.keys(results) as Strategy[]).map((k) => {
          const r = results[k];
          return (
            <section key={k} className="mt-12 break-inside-avoid">
              <h2 className="text-[24px] font-medium tracking-tight">{r.name}</h2>
              {r.flag && <p className="mt-3 rounded bg-[#F2C230] p-3 text-[13px]">{r.flag}</p>}
              <ul className="mt-4 divide-y divide-black/10 border-y border-black/10">
                {r.lines.map((l) => (
                  <li key={l.label} className="flex justify-between gap-4 py-2.5 text-[14px]">
                    <span><strong className="font-medium">{l.label}</strong> <span className="text-black/60">· {l.basis}</span></span>
                    <span className="num shrink-0">{gbp(-l.amount)}</span>
                  </li>
                ))}
              </ul>
              <ul className="mt-4 space-y-2.5">
                {r.checks.map((c) => (
                  <li key={c.label} className="flex gap-3 text-[14px]">
                    <StatusBadge status={c.status} />
                    <span><strong className="font-medium">{c.label}.</strong> <span className="text-black/70">{c.note}</span></span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}

        <section className="mt-12 break-inside-avoid border-t border-black pt-6 text-[13px] leading-relaxed text-black/70">
          <h2 className="mb-2 text-[16px] font-medium text-black">Assumptions</h2>
          <p>
            Maintenance 8% of HMO rent and 5% of serviced revenue. Voids 5% for periodic tenancies. EPC upgrade estimate capped at £
            {RULES.epcCostCap.toLocaleString('en-GB')} and spread to 1 October 2030. Landlord register £{RULES.landlordRegisterPerYear} a
            property a year. HMO licence spread over {RULES.licenceYears} years. Serviced accommodation headline assumes{' '}
            {RULES.saHeadlineOccupancy}% occupancy. Provider lease allows 4% repairs, 2% dilapidations and a three-month void across the
            lease. Mandatory licensing assumed at {RULES.mandatoryLicenceOccupants}+ bedrooms with one person per room.
          </p>
          <p className="mt-3">
            Illustrative estimates only. Not financial, investment, tax or legal advice. Rules apply to England. Verify with your
            council, solicitor, accountant and mortgage broker.
          </p>
        </section>
      </article>
    </div>
  );
}
