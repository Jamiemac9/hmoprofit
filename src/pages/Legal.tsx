import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { usePageMeta } from '../lib/meta';

function Doc({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <article className="wrap max-w-[820px] pt-16 pb-28">
      <Link to="/check" className="text-[14px] text-mist hover:text-white">← Back to the calculator</Link>
      <h1 className="display mt-6 text-[clamp(40px,6vw,72px)]">{title}</h1>
      <p className="mt-3 text-[14px] text-mist">Last updated: {updated}</p>
      <div className="mt-10 space-y-5 text-[16px] leading-relaxed text-white/85 [&_h2]:mt-10 [&_h2]:text-[22px] [&_h2]:font-medium [&_h2]:tracking-tight [&_h2]:text-white [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-2 [&_a]:underline">
        {children}
      </div>
    </article>
  );
}

const MAIL = <a href="mailto:info@hmoprofit.co.uk">info@hmoprofit.co.uk</a>;

export function Privacy() {
  usePageMeta('Privacy policy | HMO Profit', 'How HMO Profit collects, uses and protects your personal data under UK GDPR.');
  return (
    <Doc title="Privacy policy" updated="17 November 2026">
      <p>
        This Privacy Policy explains how HMO Profit ("we", "us", "our") collects, uses, stores and protects your personal data when you
        use our website, the deal check and the provider lease check (the "Service"). We are committed to protecting your privacy in
        accordance with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.
      </p>
      <h2>1. Who we are (data controller)</h2>
      <p>The data controller is Apex Digital Enterprise, the operator of HMO Profit. For privacy questions or to exercise your rights, contact {MAIL}.</p>
      <h2>2. What data we collect</h2>
      <ul>
        <li><strong>Identity and contact data:</strong> name, email address and (optionally) phone number, submitted through the form that unlocks the full breakdown.</li>
        <li><strong>Calculator and checklist inputs:</strong> non-personal figures and answers you enter. These stay in your browser unless you submit them with your contact details, when we keep a short summary of your results.</li>
        <li><strong>Payment data:</strong> if you buy the full report, payment is processed by Stripe. We do not see or store your card details; we receive confirmation that payment succeeded.</li>
        <li><strong>Technical data:</strong> IP address, browser, device, operating system and pages visited, from standard server logs and (if you accept) analytics cookies.</li>
        <li><strong>Cookies and similar technologies:</strong> see section 8.</li>
      </ul>
      <h2>3. How we use your data and the legal basis</h2>
      <ul>
        <li>To provide the Service and show your results — performance of a contract / your request.</li>
        <li>To send your results and follow-up emails about them — consent (you tick the box before the breakdown unlocks).</li>
        <li>To send related property content and offers — consent. Withdraw it at any time with the unsubscribe link in any email.</li>
        <li>To process payments and prevent fraud — performance of a contract and legitimate interests.</li>
        <li>To improve the Service, fix problems and produce anonymous statistics — legitimate interests.</li>
        <li>To meet legal, accounting and regulatory obligations — legal obligation.</li>
      </ul>
      <h2>4. Who we share your data with</h2>
      <ul>
        <li>Brevo (Sendinblue SAS, France) — to store your contact details and send transactional and marketing emails.</li>
        <li>Google Sheets / Google Workspace (Google Ireland Limited) — to log submissions for our internal records.</li>
        <li>Stripe (Stripe Payments Europe Ltd, Ireland) — to process payments for the full report.</li>
        <li>Hosting and infrastructure providers — to serve the website and store logs.</li>
      </ul>
      <p>We do not sell your personal data. Where data is transferred outside the UK or EEA, we rely on adequacy decisions or Standard Contractual Clauses.</p>
      <h2>5. How long we keep your data</h2>
      <ul>
        <li>Lead and marketing data: while you remain subscribed, plus up to 24 months of inactivity, then deleted or anonymised.</li>
        <li>Payment and accounting records: 6 years, as UK tax law requires.</li>
        <li>Server logs and analytics: up to 14 months.</li>
      </ul>
      <h2>6. Your rights under UK GDPR</h2>
      <p>You have the right to access your data, have it corrected, request erasure, restrict or object to processing, receive a portable copy, and withdraw consent at any time. You can complain to the Information Commissioner's Office at ico.org.uk or on 0303 123 1113. To exercise your rights, email {MAIL}; we will respond within one month.</p>
      <h2>7. Security</h2>
      <p>We use HTTPS encryption in transit, restricted access controls, reputable processors and regular reviews of our setup. No internet service is completely secure, but we take all reasonable steps to protect your data.</p>
      <h2>8. Cookies</h2>
      <ul>
        <li><strong>Strictly necessary:</strong> remember your cookie choice, keep your calculator inputs and answers between steps, and handle payment redirects. Always on.</li>
        <li><strong>Analytics (optional):</strong> help us understand how the Service is used. Only set if you accept.</li>
        <li><strong>Marketing (optional):</strong> measure our advertising. Only set if you accept.</li>
      </ul>
      <p>You can change your preferences at any time by clearing your browser storage or contacting us.</p>
      <h2>9. Children</h2>
      <p>The Service is not intended for anyone under 18 and we do not knowingly collect data from children.</p>
      <h2>10. Changes to this policy</h2>
      <p>We may update this policy. The date at the top shows the latest version; material changes will be highlighted on the website.</p>
      <h2>11. Contact</h2>
      <p>Questions about this policy? Email {MAIL}.</p>
    </Doc>
  );
}

export function Terms() {
  usePageMeta('Terms of use | HMO Profit', 'The terms that govern your use of HMO Profit and the full viability report.');
  return (
    <Doc title="Terms of use" updated="17 November 2026">
      <p>These Terms govern your use of the HMO Profit website, deal check and provider lease check (the "Service"). By using the Service you agree to these Terms. If you do not agree, please do not use the Service.</p>
      <h2>1. About us</h2>
      <p>The Service is operated from the United Kingdom by Apex Digital Enterprise ("we", "us", "our"). Contact: {MAIL}.</p>
      <h2>2. The Service</h2>
      <p>The Service estimates the monthly profit of a UK property under three strategies (professional HMO, serviced accommodation, and a lease to a supported housing provider) after the compliance costs and allowances it models, based on the figures you enter. Headline results are free. The line-by-line breakdown is available after you submit your contact details. A full printable report is available for a one-off payment.</p>
      <h2>3. No financial, tax or legal advice</h2>
      <p>All outputs are illustrative estimates based on your inputs and the model's assumptions. They are not financial, investment, tax, mortgage, planning or legal advice and should not be relied on for investment decisions. Get independent advice from a regulated adviser before any purchase, lease, mortgage or letting arrangement. We do not guarantee any returns, occupancy, rents or compliance outcomes. The provider lease check is general guidance, not a substitute for a solicitor's review.</p>
      <h2>4. Accuracy of information</h2>
      <p>Results depend on the inputs you provide. Defaults are illustrative only. Licensing, planning, Article 4, HMO standards, fire safety, energy performance rules, council tax, mortgage criteria and tax treatment vary by area and circumstance and may change. Always verify with your local authority, solicitor, accountant and mortgage broker.</p>
      <h2>5. Eligibility</h2>
      <p>You must be at least 18 and legally able to enter into a contract.</p>
      <h2>6. Contact details and consent</h2>
      <p>To unlock the breakdown you must provide a valid name and email address. By submitting them you confirm they are correct and consent to us emailing you your results and related communications, in line with our <Link to="/privacy-policy">privacy policy</Link>. You can unsubscribe at any time.</p>
      <h2>7. Paid reports and payment</h2>
      <ul>
        <li>The full report is offered at the price shown at checkout, currently £9 (Founder's Price), including VAT where applicable.</li>
        <li>Payment is processed by Stripe; by paying you also agree to Stripe's terms.</li>
        <li>Once payment is confirmed, the full report unlocks immediately in your browser.</li>
      </ul>
      <h2>8. Refunds and cancellation</h2>
      <p>Under the Consumer Contracts Regulations 2013 you normally have 14 days to cancel a digital purchase. By paying and immediately accessing the full report, you request immediate delivery and acknowledge that you lose the right to cancel once delivery has begun. If the report fails to deliver because of a fault on our side, contact us within 14 days for a full refund.</p>
      <h2>9. Acceptable use</h2>
      <ul>
        <li>Do not use the Service unlawfully or fraudulently.</li>
        <li>Do not scrape, reverse-engineer or interfere with the Service.</li>
        <li>Do not resell or redistribute paid reports without our written permission.</li>
        <li>Do not upload malicious code or attempt unauthorised access.</li>
      </ul>
      <h2>10. Intellectual property</h2>
      <p>All content, calculations, layouts, branding and reports belong to us or our licensors. You receive a personal, non-transferable licence to use a report for your own property decisions.</p>
      <h2>11. Limitation of liability</h2>
      <p>To the extent the law allows, we are not liable for indirect or consequential loss, loss of profit or opportunity, or loss from relying on the estimates. Our total liability for any claim is limited to the amount you paid us in the 12 months before it. Nothing limits liability for death or personal injury caused by negligence, fraud, or anything that cannot be excluded under UK law.</p>
      <h2>12. Service availability</h2>
      <p>We aim to keep the Service available but do not guarantee uninterrupted access, and may change or withdraw any part of it.</p>
      <h2>13. Changes to these Terms</h2>
      <p>We may update these Terms. The date at the top shows the latest version. Continued use after changes means you accept them.</p>
      <h2>14. Governing law</h2>
      <p>These Terms are governed by the laws of England and Wales, and the courts of England and Wales have exclusive jurisdiction.</p>
      <h2>15. Contact</h2>
      <p>Questions about these Terms? Email {MAIL}.</p>
    </Doc>
  );
}

export function NotFound() {
  usePageMeta('Page not found | HMO Profit', 'This page does not exist.');
  return (
    <div className="wrap grid min-h-[70vh] place-content-center text-center">
      <p className="num text-[120px] leading-none text-signal">404</p>
      <h1 className="mt-4 text-[28px] font-medium">That page isn't here</h1>
      <div className="mt-8 flex justify-center gap-3">
        <Link to="/" className="btn btn-light">Home</Link>
        <Link to="/check" className="btn btn-signal">Check a deal</Link>
      </div>
    </div>
  );
}
