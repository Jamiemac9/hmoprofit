/**
 * HMO Profit — compliance-adjusted viability maths.
 *
 * Every strategy returns three figures:
 *   headline   – what a typical "rent minus mortgage" calculator shows
 *   load       – the monthly cost of the rules and realistic allowances
 *   compliant  – headline minus load
 * plus `stress`: compliant profit with the mortgage rate +1 point
 * (or a 5% rent review when the property is leased rather than owned).
 *
 * All figures are monthly, in pounds. Rules are for England.
 */

export type Strategy = 'hmo' | 'sa' | 'sh';
export type Status = 'pass' | 'action' | 'check';
export type EpcBand = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'unknown';
export type YesNoUnknown = 'yes' | 'no' | 'unknown';

export interface Inputs {
  tenure: 'own' | 'lease';
  bedrooms: number;
  // Owned
  purchasePrice: number;
  deposit: number;
  ratePct: number;
  termYears: number;
  mortgageType: 'io' | 'repayment';
  // Leased (rent-to-rent)
  landlordRent: number;
  // HMO
  roomRent: number;
  billsPerRoom: number;
  managementPct: number;
  epcBand: EpcBand;
  article4: YesNoUnknown;
  roomsMeetSize: boolean;
  licenceFee: number;
  insurance: number;
  // Serviced accommodation
  nightlyRate: number;
  occupancyPct: number;
  avgStayNights: number;
  cleanPerStay: number;
  platformPct: number;
  saFixedCosts: number;
  // Supported housing (lease to a provider)
  providerLease: number;
  leaseYears: number;
}

export interface Line {
  label: string;
  basis: string;
  amount: number; // positive number, shown as a deduction
}

export interface Check {
  status: Status;
  label: string;
  note: string;
}

export interface Result {
  strategy: Strategy;
  name: string;
  headline: number;
  lines: Line[];
  load: number;
  compliant: number;
  stress: number;
  stressLabel: string;
  checks: Check[];
  flag?: string;
}

/** Constants with their source, so they can be checked and updated in one place. */
export const RULES = {
  /** EPC C minimum for all private lets, new and existing (Jan 2026 government response). */
  epcDeadline: new Date('2030-10-01T00:00:00Z'),
  /** Spending cap on EPC upgrades per property. */
  epcCostCap: 10_000,
  /** Register your rental property service: £65 per property per year (GOV.UK guidance, Oct 2026). */
  landlordRegisterPerYear: 65,
  /** Minimum bedroom size for one adult in a licensed HMO, m². */
  minRoomOneAdult: 6.51,
  /** Mandatory HMO licensing threshold: 5+ people from 2+ households. */
  mandatoryLicenceOccupants: 5,
  /** Typical licence term in years, used to spread the fee. */
  licenceYears: 5,
  /** Optimistic occupancy most SA projections assume. */
  saHeadlineOccupancy: 80,
  avgDaysPerMonth: 30.4,
} as const;

/** Estimated upgrade spend to reach EPC C, capped. Rough planning figures, not quotes. */
const EPC_UPGRADE_ESTIMATE: Record<EpcBand, number> = {
  A: 0,
  B: 0,
  C: 0,
  D: 5_000,
  E: 8_000,
  F: RULES.epcCostCap,
  G: RULES.epcCostCap,
  unknown: 6_000,
};

export const DEFAULT_INPUTS: Inputs = {
  tenure: 'own',
  bedrooms: 6,
  purchasePrice: 285_000,
  deposit: 71_250,
  ratePct: 5.75,
  termYears: 25,
  mortgageType: 'io',
  landlordRent: 1_600,
  roomRent: 575,
  billsPerRoom: 120,
  managementPct: 12,
  epcBand: 'D',
  article4: 'unknown',
  roomsMeetSize: true,
  licenceFee: 1_100,
  insurance: 65,
  nightlyRate: 140,
  occupancyPct: 65,
  avgStayNights: 3,
  cleanPerStay: 55,
  platformPct: 15,
  saFixedCosts: 650,
  providerLease: 2_600,
  leaseYears: 5,
};

const round = (n: number) => Math.round(n);

export function monthlyMortgage(loan: number, ratePct: number, termYears: number, type: 'io' | 'repayment'): number {
  if (loan <= 0) return 0;
  const r = ratePct / 100 / 12;
  const n = Math.max(1, termYears) * 12;
  if (type === 'io') return loan * r;
  if (r === 0) return loan / n;
  return (loan * r) / (1 - Math.pow(1 + r, -n));
}

export function monthsUntil(target: Date, asOf: Date): number {
  const months = (target.getUTCFullYear() - asOf.getUTCFullYear()) * 12 + (target.getUTCMonth() - asOf.getUTCMonth());
  return Math.max(1, months);
}

interface Housing {
  cost: number;
  stressed: number;
  stressLabel: string;
}

function housingCost(i: Inputs): Housing {
  if (i.tenure === 'lease') {
    return { cost: i.landlordRent, stressed: i.landlordRent * 1.05, stressLabel: 'after a 5% rent review' };
  }
  const loan = Math.max(0, i.purchasePrice - i.deposit);
  return {
    cost: monthlyMortgage(loan, i.ratePct, i.termYears, i.mortgageType),
    stressed: monthlyMortgage(loan, i.ratePct + 1, i.termYears, i.mortgageType),
    stressLabel: 'at +1% on the mortgage rate',
  };
}

function epcLine(i: Inputs, asOf: Date): Line | null {
  if (i.tenure === 'lease') return null; // the owner's liability, not a rent-to-rent operator's
  const spend = EPC_UPGRADE_ESTIMATE[i.epcBand];
  if (spend === 0) return null;
  const months = monthsUntil(RULES.epcDeadline, asOf);
  return {
    label: 'EPC C upgrade',
    basis: `About £${spend.toLocaleString('en-GB')} for band ${i.epcBand === 'unknown' ? '(unknown)' : i.epcBand}, spread over ${months} months to 1 Oct 2030`,
    amount: spend / months,
  };
}

function registerAndLicence(i: Inputs, includeLicence: boolean): Line {
  const licence = includeLicence ? i.licenceFee / (RULES.licenceYears * 12) : 0;
  const register = RULES.landlordRegisterPerYear / 12;
  return {
    label: includeLicence ? 'Licence, landlord register and insurance' : 'Landlord register and insurance',
    basis: includeLicence
      ? `£${i.licenceFee.toLocaleString('en-GB')} licence over ${RULES.licenceYears} years, £65/yr register, £${i.insurance}/mo cover`
      : `£65/yr register, £${i.insurance}/mo cover`,
    amount: licence + register + i.insurance,
  };
}

function epcCheck(i: Inputs, strategyIsShortLet = false): Check {
  if (strategyIsShortLet) {
    return { status: 'pass', label: 'EPC minimum', note: 'The 2030 EPC C standard does not apply to short-term lets.' };
  }
  if (i.epcBand === 'unknown') {
    return { status: 'check', label: 'EPC rating', note: 'Rating not entered. C is required by 1 October 2030 for all private lets.' };
  }
  if (['A', 'B', 'C'].includes(i.epcBand)) {
    return { status: 'pass', label: `EPC rating ${i.epcBand}`, note: 'Already meets the 2030 minimum of C.' };
  }
  return { status: 'action', label: `EPC rating ${i.epcBand}`, note: 'Needs C by 1 October 2030 for new and existing tenancies.' };
}

function finish(
  strategy: Strategy,
  name: string,
  headline: number,
  lines: Line[],
  housing: Housing,
  checks: Check[],
  flag?: string,
): Result {
  const load = lines.reduce((s, l) => s + l.amount, 0);
  const compliant = headline - load;
  return {
    strategy,
    name,
    headline: round(headline),
    lines: lines.map((l) => ({ ...l, amount: round(l.amount) })),
    load: round(load),
    compliant: round(compliant),
    stress: round(compliant - (housing.stressed - housing.cost)),
    stressLabel: housing.stressLabel,
    checks,
    flag,
  };
}

export function calcHmo(i: Inputs, asOf = new Date()): Result {
  const h = housingCost(i);
  const gross = i.bedrooms * i.roomRent;
  const bills = i.bedrooms * i.billsPerRoom;
  const mgmt = (gross * i.managementPct) / 100;
  const headline = gross - h.cost - bills - mgmt;

  const lines: Line[] = [
    { label: 'Maintenance reserve', basis: '8% of rent, typical for a shared house', amount: gross * 0.08 },
    { label: 'Voids', basis: "5% allowance for periodic tenancies under the Renters' Rights Act", amount: gross * 0.05 },
  ];
  const epc = epcLine(i, asOf);
  if (epc) lines.push(epc);
  lines.push(registerAndLicence(i, true));

  const mandatory = i.bedrooms >= RULES.mandatoryLicenceOccupants;
  const checks: Check[] = [
    mandatory
      ? { status: 'action', label: 'Mandatory HMO licence', note: 'Five or more people from two or more households. Apply before the first tenant moves in.' }
      : { status: 'check', label: 'Additional licensing', note: 'Below the mandatory threshold, but many councils license smaller HMOs. Check the local scheme.' },
    i.article4 === 'yes'
      ? { status: 'action', label: 'Article 4 direction', note: 'Planning permission is needed to change a family house (C3) to an HMO (C4).' }
      : i.article4 === 'no'
        ? { status: 'pass', label: 'Article 4 direction', note: 'No direction entered for this area. Confirm with the council in writing.' }
        : { status: 'check', label: 'Article 4 direction', note: 'Confirm with the council whether C3 to C4 needs planning permission here.' },
    i.roomsMeetSize
      ? { status: 'pass', label: 'Room sizes', note: `All bedrooms entered at or above ${RULES.minRoomOneAdult} m² for one adult.` }
      : { status: 'action', label: 'Room sizes', note: `A room below ${RULES.minRoomOneAdult} m² can't be let to an adult. Re-run with fewer rooms.` },
    { status: 'action', label: 'Fire safety', note: "Interlinked alarms and fire doors to the escape route, to the council's HMO standard." },
    epcCheck(i),
    { status: 'action', label: 'Landlord register', note: 'Register the property on the government service when your region opens (£65 a year).' },
  ];

  return finish('hmo', 'Professional HMO', headline, lines, h, checks);
}

export function calcSa(i: Inputs, _asOf = new Date()): Result {
  const h = housingCost(i);
  const fee = i.platformPct / 100;
  const optimisticRevenue = RULES.avgDaysPerMonth * (RULES.saHeadlineOccupancy / 100) * i.nightlyRate;
  const bookedNights = RULES.avgDaysPerMonth * (i.occupancyPct / 100);
  const revenue = bookedNights * i.nightlyRate;
  const headline = optimisticRevenue * (1 - fee) - h.cost;

  const lines: Line[] = [];
  if (i.occupancyPct < RULES.saHeadlineOccupancy) {
    lines.push({
      label: 'Realistic occupancy',
      basis: `${i.occupancyPct}% across the year rather than ${RULES.saHeadlineOccupancy}%`,
      amount: (optimisticRevenue - revenue) * (1 - fee),
    });
  }
  lines.push(
    { label: 'Cleaning and laundry', basis: `£${i.cleanPerStay} per stay, average ${i.avgStayNights} nights`, amount: (bookedNights / Math.max(1, i.avgStayNights)) * i.cleanPerStay },
    { label: 'Bills, rates and consumables', basis: 'Costs you carry that a tenant would normally pay', amount: i.saFixedCosts },
    { label: 'Maintenance reserve', basis: '5% of revenue for wear from short stays', amount: revenue * 0.05 },
  );

  const checks: Check[] = [
    { status: 'check', label: 'Planning for short-let use', note: 'Some councils treat full-time short letting as a change of use. Confirm first.' },
    { status: 'check', label: 'Mortgage and insurance', note: 'Standard buy-to-let terms often exclude serviced accommodation.' },
    { status: 'action', label: 'Fire risk assessment', note: 'Paying guests bring fire safety duties under the Fire Safety Order.' },
    epcCheck(i, true),
  ];

  return finish('sa', 'Serviced accommodation', headline, lines, h, checks);
}

export function calcSh(i: Inputs, _asOf = new Date()): Result {
  const h = housingCost(i);
  const headline = i.providerLease - h.cost;
  const isHmo = i.bedrooms >= RULES.mandatoryLicenceOccupants;
  const lines: Line[] = [
    { label: 'Repairs outside the lease', basis: "4% of the lease for structural and external items the provider won't cover", amount: i.providerLease * 0.04 },
    { label: 'Provider-exit void', basis: `Three months empty, spread across a ${i.leaseYears}-year lease`, amount: (i.providerLease * 3) / (Math.max(1, i.leaseYears) * 12) },
    { label: 'Dilapidations allowance', basis: 'Making good at lease end, 2% of the lease', amount: i.providerLease * 0.02 },
    registerAndLicence(i, isHmo),
  ];
  const checks: Check[] = [
    { status: 'check', label: 'Provider standing', note: 'Registered provider or not? Track record with the council? Run the provider lease check.' },
    { status: 'check', label: 'Support evidence', note: 'Can they show support is planned, delivered and reviewed for each resident?' },
    { status: 'check', label: 'Licensing readiness', note: 'Will they meet licence conditions when the council starts its supported housing scheme?' },
    { status: 'action', label: 'Lease terms', note: 'Break clauses, rent review and who holds repair and compliance liability.' },
    isHmo
      ? { status: 'action', label: 'HMO licence and fire safety', note: 'Still needed where the scheme is an HMO, whoever runs it.' }
      : { status: 'check', label: 'Fire safety', note: 'Confirm the fire strategy suits residents with support needs.' },
  ];
  const flag =
    "These figures only hold if the provider does. Rent in exempt accommodation depends on support being genuinely delivered, and supported housing licensing is on its way. Check the provider before you sign.";
  return finish('sh', 'Lease to a provider', headline, lines, h, checks, flag);
}

export function calcAll(i: Inputs, asOf = new Date()): Record<Strategy, Result> {
  return { hmo: calcHmo(i, asOf), sa: calcSa(i, asOf), sh: calcSh(i, asOf) };
}

export const gbp = (n: number) => {
  const s = Math.abs(n).toLocaleString('en-GB', { maximumFractionDigits: 0 });
  return `${n < 0 ? '−' : ''}£${s}`;
};
