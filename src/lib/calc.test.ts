import { describe, expect, it } from 'vitest';
import { DEFAULT_INPUTS, calcHmo, calcSa, calcSh, monthlyMortgage, monthsUntil, RULES } from './calc';

const asOf = new Date('2026-11-17T00:00:00Z');

describe('monthlyMortgage', () => {
  it('interest-only is loan × rate / 12', () => {
    expect(monthlyMortgage(213_750, 5.75, 25, 'io')).toBeCloseTo(1024.22, 1);
  });
  it('repayment matches the standard annuity formula', () => {
    // £100k, 6%, 25 years ≈ £644.30
    expect(monthlyMortgage(100_000, 6, 25, 'repayment')).toBeCloseTo(644.3, 1);
  });
  it('zero loan costs nothing', () => {
    expect(monthlyMortgage(0, 6, 25, 'repayment')).toBe(0);
  });
});

describe('monthsUntil', () => {
  it('counts whole months to the EPC deadline', () => {
    expect(monthsUntil(RULES.epcDeadline, asOf)).toBe(47);
  });
  it('never returns less than one', () => {
    expect(monthsUntil(RULES.epcDeadline, new Date('2031-01-01'))).toBe(1);
  });
});

describe('calcHmo', () => {
  const r = calcHmo(DEFAULT_INPUTS, asOf);
  it('headline is rent minus mortgage, bills and management', () => {
    // 3450 − 1024.22 − 720 − 414 = 1291.78
    expect(r.headline).toBe(1292);
  });
  it('compliant = headline − load', () => {
    expect(Math.abs(r.compliant - (r.headline - r.load))).toBeLessThanOrEqual(1);
  });
  it('stress test removes the extra 1% of interest', () => {
    expect(r.compliant - r.stress).toBe(178);
  });
  it('flags mandatory licensing at 5+ bedrooms', () => {
    expect(r.checks[0].label).toBe('Mandatory HMO licence');
    expect(calcHmo({ ...DEFAULT_INPUTS, bedrooms: 4 }, asOf).checks[0].label).toBe('Additional licensing');
  });
  it('drops the EPC line for band C and above, and for leased properties', () => {
    expect(calcHmo({ ...DEFAULT_INPUTS, epcBand: 'C' }, asOf).lines.some((l) => l.label === 'EPC C upgrade')).toBe(false);
    expect(calcHmo({ ...DEFAULT_INPUTS, tenure: 'lease' }, asOf).lines.some((l) => l.label === 'EPC C upgrade')).toBe(false);
  });
});

describe('calcSa', () => {
  it('occupancy line disappears at or above the headline assumption', () => {
    expect(calcSa({ ...DEFAULT_INPUTS, occupancyPct: 80 }, asOf).lines[0].label).not.toBe('Realistic occupancy');
  });
  it('EPC check passes for short lets', () => {
    expect(calcSa(DEFAULT_INPUTS, asOf).checks.find((c) => c.label === 'EPC minimum')?.status).toBe('pass');
  });
});

describe('calcSh', () => {
  const r = calcSh(DEFAULT_INPUTS, asOf);
  it('headline is lease minus mortgage', () => {
    expect(r.headline).toBe(2600 - 1024);
  });
  it('always carries the provider flag', () => {
    expect(r.flag).toBeTruthy();
  });
});
