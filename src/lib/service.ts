/**
 * Provider review — the paid, done-for-you check of a supported housing provider
 * before a landlord signs their lease. Change price, turnaround and wording here.
 */
export const REVIEW = {
  name: 'Provider review',
  /** Fixed fee shown on the page. Set to your real price. */
  price: '£295',
  priceNote: 'fixed fee, plus VAT if applicable',
  /** Working days from receiving the provider's documents to the written report. */
  turnaroundDays: 5,
  callMinutes: 30,
  /** How fast you promise to call back after a request. */
  responseTime: 'one working day',
  /** Optional Stripe Payment Link, sent only after scope is agreed (never shown before). */
  paymentLink: (import.meta.env.VITE_REVIEW_PAYMENT_LINK as string | undefined) || undefined,
} as const;

export interface ReviewArea {
  title: string;
  what: string;
  checks: string[];
}

/** What the review covers. Each area gets a red / amber / green rating in the report. */
export const REVIEW_AREAS: ReviewArea[] = [
  {
    title: 'Who the provider is',
    what: 'Whether the organisation behind the lease is what it says it is, and stable enough to hold a five-year lease.',
    checks: [
      'Companies House: incorporation, directors, filing history and charges',
      'Registered provider status on the Regulator of Social Housing register, or the RP they lease through',
      'Latest accounts and how dependent they are on one council or scheme',
      'Directors’ other companies, including any dissolved or struck off',
    ],
  },
  {
    title: 'The support',
    what: 'Whether care, support or supervision is genuinely planned, delivered and recorded, because exempt rent depends on it.',
    checks: [
      'Anonymised needs assessments, support plans and reviews',
      'Who delivers support, their roles and planned hours per resident',
      'Safeguarding, incident and complaints records and policies',
      'Referral routes and evidence of a working relationship with the council',
    ],
  },
  {
    title: 'Regulation and licensing',
    what: 'Whether the provider is ready for the rules that apply to this scheme now, and the ones coming.',
    checks: [
      'Readiness for local supported housing licensing under the Supported Housing (Regulatory Oversight) Act 2023',
      'Ofsted registration where the scheme houses looked-after 16 and 17-year-olds or care leavers',
      'CQC registration where personal care is delivered',
      'The council’s published approach to exempt accommodation in your area',
    ],
  },
  {
    title: 'Your property and the lease',
    what: 'What stays your responsibility, and the lease points to raise with your solicitor before signing.',
    checks: [
      'HMO licence, fire risk assessment, gas safety, EICR and EPC, and who keeps them current',
      'What happens to your rent if Housing Benefit is reduced or stopped',
      'Break clauses, notice, rent review and the hand-back condition',
      'Repair, insurance and compliance liability in the draft lease',
    ],
  },
];

/** Documents a landlord can ask the provider for up front. */
export const DOCUMENT_REQUEST = [
  'Company number and, if relevant, Regulator of Social Housing registration number or the name of your RP partner',
  'Latest filed accounts, or management accounts if newer',
  'Two anonymised support plans with their most recent reviews',
  'An anonymised needs assessment and the referral it came from',
  'Staffing structure and planned support hours per resident',
  'Safeguarding policy, and incident and complaints logs for the last 12 months (anonymised)',
  'Evidence of council or commissioner relationship, such as referral agreements or correspondence',
  'Ofsted or CQC registration certificates, where the scheme needs them',
  'Your plan for local supported housing licensing',
  'The draft lease, including any schedule of condition',
  'Contact details for two landlords you lease from now',
];
