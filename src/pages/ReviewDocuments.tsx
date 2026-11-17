import { useState } from 'react';
import { Link } from 'react-router-dom';
import { DOCUMENT_REQUEST } from '../lib/service';
import { usePageMeta } from '../lib/meta';

const EMAIL_BODY = `Hello,

Before I sign the lease, I'm having the scheme independently reviewed. Could you send the following? Please anonymise anything about residents.

${DOCUMENT_REQUEST.map((d, n) => `${n + 1}. ${d}`).join('\n')}

If anything isn't available, please say which items and why.

Thanks,`;

export default function ReviewDocuments() {
  usePageMeta(
    'Documents to ask a supported housing provider for | HMO Profit',
    'The documents to request from a supported housing provider before signing their lease, with an email you can copy and send.',
  );
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL_BODY);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      /* clipboard blocked: the text is on screen to select */
    }
  };
  return (
    <div className="wrap max-w-[900px] pt-16 pb-28">
      <Link to="/provider-review" className="no-print text-[14px] text-mist hover:text-white">← Provider review</Link>
      <p className="eyebrow mt-8 text-mist">Document request</p>
      <h1 className="display mt-3 text-[clamp(38px,6vw,68px)]">What to ask the provider for</h1>
      <p className="mt-5 max-w-[680px] text-[17px] leading-relaxed text-white/80">
        Send this before you sign, whether or not you use our review. A provider that is genuinely delivering support can produce most of it
        quickly. Gaps and refusals are useful answers too.
      </p>

      <ol className="print-plain mt-10 space-y-0 rounded-[8px] border border-rule bg-panel">
        {DOCUMENT_REQUEST.map((d, n) => (
          <li key={d} className="grid grid-cols-[44px_1fr] gap-3 border-b border-rule px-6 py-4 text-[15px] leading-relaxed last:border-0">
            <span className="num text-mist">{String(n + 1).padStart(2, '0')}</span>
            {d}
          </li>
        ))}
      </ol>

      <section className="mt-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-[26px] font-medium tracking-tight">Email to send</h2>
          <div className="no-print flex flex-wrap gap-2">
            <button type="button" onClick={copy} className="btn btn-light" aria-live="polite">
              {copied ? 'Copied' : 'Copy email'}
            </button>
            <a
              href={`mailto:?subject=${encodeURIComponent('Documents before signing the lease')}&body=${encodeURIComponent(EMAIL_BODY)}`}
              className="btn btn-ghost"
            >
              Open in my email
            </a>
            <button type="button" onClick={() => window.print()} className="btn btn-ghost">Print</button>
          </div>
        </div>
        <pre className="print-plain mt-5 overflow-x-auto rounded-[8px] border border-rule bg-panel-2 p-6 font-sans text-[14px] leading-relaxed whitespace-pre-wrap text-white/85">
          {EMAIL_BODY}
        </pre>
      </section>

      <div className="no-print mt-12 flex flex-wrap items-center justify-between gap-6 rounded-[8px] bg-signal p-8">
        <div>
          <h2 className="text-[24px] font-medium tracking-tight">Want us to read what comes back?</h2>
          <p className="mt-1 text-[15px] text-white/90">We'll review it, rate the provider and tell you what to take to your solicitor.</p>
        </div>
        <Link to="/provider-review#request" className="btn btn-light">Request a provider review</Link>
      </div>
    </div>
  );
}
