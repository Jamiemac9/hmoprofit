/**
 * First-touch attribution: where a visitor first came from, kept for the session's leads.
 * Guide pages (static HTML) write the same key with the same rules, so a LinkedIn click
 * on a guide is still credited when the lead comes in on the deal check.
 */
export interface Attribution {
  channel: string; // linkedin | blog | search | email | referral | direct | <utm_source>
  campaign?: string;
  landing: string;
}

const KEY = 'hp-attr';

export function channelFrom(utmSource: string | null, referrer: string, landingPath: string): string {
  const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 30);
  if (utmSource) return clean(utmSource) || 'direct';
  let host = '';
  try {
    host = referrer ? new URL(referrer).hostname : '';
  } catch {
    host = '';
  }
  if (/linkedin\.|lnkd\.in/.test(host)) return 'linkedin';
  if (/google\.|bing\.|duckduckgo\.|yahoo\.|ecosia\./.test(host)) return landingPath.startsWith('/guides') ? 'blog-search' : 'search';
  if (/mail\.|outlook\.|brevo|sendibt/.test(host)) return 'email';
  if (landingPath.startsWith('/guides')) return 'blog';
  if (host && !host.endsWith('hmoprofit.co.uk') && !host.endsWith('hmoprofit.netlify.app')) return 'referral';
  return 'direct';
}

/** Call once on app start. Keeps the first touch; never overwrites it. */
export function captureAttribution() {
  try {
    if (localStorage.getItem(KEY)) return;
    const url = new URL(window.location.href);
    const a: Attribution = {
      channel: channelFrom(url.searchParams.get('utm_source'), document.referrer, url.pathname),
      campaign: url.searchParams.get('utm_campaign')?.slice(0, 60) || undefined,
      landing: url.pathname.slice(0, 120),
    };
    localStorage.setItem(KEY, JSON.stringify(a));
  } catch {
    /* storage unavailable */
  }
}

export function readAttribution(): Attribution {
  try {
    const a = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (a && typeof a.channel === 'string') return a;
  } catch {
    /* ignore */
  }
  return { channel: 'direct', landing: window.location.pathname };
}
