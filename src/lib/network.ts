import type { Inputs, Strategy } from './calc';
import type { Role } from './lead';
import { REVIEW } from './service';

export interface Link {
  tag: string;
  title: string;
  text: string;
  href: string;
  internal?: boolean;
}

/** The SEA network, in one place so every page links the same way. */
export const SITES = {
  supportAudit: { name: 'Support Audit', href: 'https://supportaudit.co.uk' },
  exempt: { name: 'Exempt Accommodation', href: 'https://exemptaccommodation.com' },
  epc: { name: 'EPC Birmingham', href: 'https://epcbirmingham.co.uk' },
} as const;

/** Next steps after a deal check, by strategy, figures and (once known) who the person is. */
export function nextSteps(i: Inputs, s: Strategy, role?: Role): Link[] {
  const out: Link[] = [];
  const epcBelowC = ['D', 'E', 'F', 'G', 'unknown'].includes(i.epcBand) && i.tenure === 'own';

  if (role === 'provider') {
    out.push({ tag: 'For providers', title: SITES.supportAudit.name, text: 'An independent check that your property and support evidence stands up before licensing.', href: SITES.supportAudit.href });
  }
  if (s === 'sh') {
    out.push({ tag: 'Before you sign', title: 'Run the provider lease check', text: 'Twelve questions to put to any supported housing provider. Free.', href: '/provider-check', internal: true });
    if (role !== 'provider') {
      out.push({ tag: `Done for you · ${REVIEW.price}`, title: 'Provider review', text: 'We check the provider, their support evidence and the lease before you sign.', href: '/provider-review', internal: true });
    }
    if (role !== 'provider') {
      out.push({ tag: 'For the provider', title: SITES.supportAudit.name, text: 'Point them here to evidence their support before licensing arrives.', href: SITES.supportAudit.href });
    }
    out.push({ tag: 'Guides', title: SITES.exempt.name, text: 'How exempt rent and provider leases work.', href: SITES.exempt.href });
  }
  if (s !== 'sa' && epcBelowC) {
    out.push({ tag: 'EPC below C', title: 'Get a current EPC', text: 'Know the real upgrade bill before 2030 makes it urgent.', href: SITES.epc.href });
  }
  if (s !== 'sa') {
    out.push({ tag: 'Guide', title: 'The landlord register', text: 'What it costs an HMO, and the deadline for your region.', href: '/guides/register-your-rental-property-hmo' });
  }
  return out;
}
