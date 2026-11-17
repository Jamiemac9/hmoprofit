/**
 * Builds static, crawlable guide pages from content/guides/*.md into dist/guides/,
 * plus dist/sitemap.xml. Runs after `vite build`.
 *
 * Front matter: title, seoTitle?, description, kicker?, published, updated?, image?
 * A new guide = a new markdown file. Nothing else to change.
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import matter from 'gray-matter';
import { marked } from 'marked';

const ROOT = new URL('..', import.meta.url).pathname;
const SRC = join(ROOT, 'content/guides');
const OUT = join(ROOT, 'dist/guides');
const SITE = 'https://hmoprofit.co.uk';

const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const iso = (d) => new Date(d).toISOString().slice(0, 10);
const human = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

const CSS = `
:root{--ink:#000;--panel:#121416;--rule:#2a2f34;--mist:#8f99a3;--signal:#1e6ef3}
*{box-sizing:border-box}html{background:#000;color:#fff;-webkit-font-smoothing:antialiased}
body{margin:0;font-family:Geist,ui-sans-serif,system-ui,sans-serif;font-size:17px;line-height:1.65}
a{color:#fff}a:hover{color:#9cc0ff}:focus-visible{outline:2px solid var(--signal);outline-offset:3px}
.skip{position:absolute;left:-9999px}.skip:focus{left:8px;top:8px;background:#fff;color:#000;padding:8px 12px;z-index:9}
.bar{display:block;background:var(--signal);color:#fff;text-align:center;font-size:13px;font-weight:500;padding:10px 16px;text-decoration:none}
.nav{position:sticky;top:12px;z-index:5;margin:12px auto 0;max-width:760px;display:flex;justify-content:space-between;align-items:center;gap:12px;padding:6px 6px 6px 16px;border:1px solid rgba(255,255,255,.1);border-radius:10px;background:rgba(20,22,24,.88);backdrop-filter:blur(10px)}
.nav-links{display:flex;gap:4px;align-items:center;flex-wrap:wrap}.nav-links a{color:rgba(255,255,255,.8);text-decoration:none;font-size:14px;padding:10px 12px;border-radius:6px}
.logo{display:flex;align-items:center;gap:10px;text-decoration:none;font-weight:500;letter-spacing:-.01em}
.cta{background:var(--signal)!important;color:#fff!important;padding:11px 16px!important}
.wrap{max-width:780px;margin:0 auto;padding:0 24px}
.crumbs{margin-top:56px;font-size:14px;color:var(--mist)}.crumbs a{color:var(--mist)}
.kicker{font-family:'Geist Mono',ui-monospace,monospace;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--mist);margin:40px 0 0}
h1{font-size:clamp(38px,6vw,64px);line-height:1;letter-spacing:-.035em;font-weight:560;margin:14px 0 0}
.meta{color:var(--mist);font-size:14px;margin-top:18px}
.prose{margin-top:40px}.prose h2{font-size:26px;letter-spacing:-.02em;font-weight:560;margin:48px 0 8px}
.prose p,.prose li{color:rgba(255,255,255,.86)}.prose li{margin:6px 0}
.prose table{width:100%;border-collapse:collapse;margin:20px 0;font-size:15px;display:block;overflow-x:auto}
.prose th,.prose td{text-align:left;padding:10px 12px;border-bottom:1px solid var(--rule);white-space:nowrap}.prose th{color:var(--mist);font-weight:500}
.prose code{font-family:'Geist Mono',monospace}
.box{margin:56px 0 0;padding:28px;border-radius:8px;background:var(--signal)}
.box h2{margin:0 0 6px;font-size:24px;letter-spacing:-.02em;font-weight:560}.box p{margin:0 0 18px;color:rgba(255,255,255,.9)}
.btn{display:inline-flex;align-items:center;min-height:46px;padding:0 20px;border-radius:6px;background:#fff;color:#000;text-decoration:none;font-weight:500}
.list{list-style:none;padding:0;margin:40px 0 0;border-top:1px solid var(--rule)}
.list li{border-bottom:1px solid var(--rule)}.list a{display:block;padding:26px 4px;text-decoration:none}
.list a:hover{background:var(--panel)}.list strong{display:block;font-size:22px;font-weight:500;letter-spacing:-.015em}
.list span{display:block;color:rgba(255,255,255,.72);margin-top:6px;font-size:15px}.list time{font-size:13px;color:var(--mist)}
footer{margin-top:120px;background:var(--signal);padding:48px 0 32px;font-size:14px}
footer nav{display:flex;gap:20px;flex-wrap:wrap}footer p{color:rgba(255,255,255,.85);max-width:560px}
`;

const LOGO = `<svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="7" fill="#1E6EF3"/><path d="M7 15 16 8l9 7v10H7z" fill="none" stroke="#fff" stroke-width="2.4" stroke-linejoin="round"/><path d="M13 25v-6h6v6" fill="none" stroke="#fff" stroke-width="2.4"/></svg>`;

function page({ title, description, canonical, body, jsonld, image }) {
  return `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${canonical}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<meta name="theme-color" content="#000000">
<meta property="og:type" content="article"><meta property="og:locale" content="en_GB"><meta property="og:site_name" content="HMO Profit">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${canonical}">
${image ? `<meta property="og:image" content="${SITE}${image}"><meta name="twitter:card" content="summary_large_image">` : ''}
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400..600&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>${CSS}</style>
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>` : ''}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<a class="bar" href="/provider-check">New: check a supported housing provider before you sign their lease →</a>
<div style="padding:0 12px"><nav class="nav" aria-label="Main">
<a class="logo" href="/">${LOGO}<span>HMO Profit</span></a>
<div class="nav-links"><a href="/provider-check">Provider check</a><a href="/guides/">Guides</a><a class="cta" href="/check">Check a deal</a></div>
</nav></div>
<main id="main" class="wrap">${body}</main>
<footer><div class="wrap">
<nav aria-label="Footer"><a href="/check">Deal check</a><a href="/provider-check">Provider check</a><a href="/provider-review">Provider review</a><a href="/guides/">Guides</a><a href="/privacy-policy">Privacy policy</a><a href="/terms">Terms of use</a><a href="mailto:info@hmoprofit.co.uk">info@hmoprofit.co.uk</a></nav>
<p>Figures are illustrative and not financial, investment, tax or legal advice. © ${new Date().getFullYear()} Apex Digital Enterprise.</p>
</div></footer>
</body>
</html>`;
}

const files = existsSync(SRC) ? readdirSync(SRC).filter((f) => f.endsWith('.md')) : [];
const guides = files
  .map((f) => {
    const { data, content } = matter(readFileSync(join(SRC, f), 'utf8'));
    return { slug: basename(f, '.md'), ...data, html: marked.parse(content) };
  })
  .sort((a, b) => new Date(b.published) - new Date(a.published));

mkdirSync(OUT, { recursive: true });

for (const g of guides) {
  const canonical = `${SITE}/guides/${g.slug}`;
  const body = `
<p class="crumbs"><a href="/">Home</a> / <a href="/guides/">Guides</a></p>
${g.kicker ? `<p class="kicker">${esc(g.kicker)}</p>` : ''}
<h1>${esc(g.title)}</h1>
<p class="meta">HMO Profit · Published <time datetime="${iso(g.published)}">${human(g.published)}</time>${g.updated ? ` · Updated <time datetime="${iso(g.updated)}">${human(g.updated)}</time>` : ''}</p>
<article class="prose">${g.html}</article>
<aside class="box"><h2>Run the numbers</h2><p>See what's left after licensing, the register, voids and EPC C by 2030.</p><a class="btn" href="/check">Check a deal</a></aside>`;
  const jsonld = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: g.title,
    description: g.description,
    author: { '@type': 'Organization', name: 'HMO Profit', url: SITE },
    publisher: { '@type': 'Organization', name: 'HMO Profit', url: SITE },
    datePublished: iso(g.published),
    dateModified: iso(g.updated ?? g.published),
    ...(g.image ? { image: `${SITE}${g.image}` } : {}),
    mainEntityOfPage: canonical,
  };
  writeFileSync(join(OUT, `${g.slug}.html`), page({ title: g.seoTitle ?? `${g.title} | HMO Profit`, description: g.description, canonical, body, jsonld, image: g.image }));
}

const index = `
<p class="crumbs"><a href="/">Home</a> / Guides</p>
<h1 style="margin-top:40px">HMO guides</h1>
<p class="meta" style="font-size:17px;color:rgba(255,255,255,.8)">Plain-English guides on the costs and rules that decide whether a property pays. Every fact is sourced.</p>
<ul class="list">${guides
  .map((g) => `<li><a href="/guides/${g.slug}"><time datetime="${iso(g.published)}">${human(g.published)}</time><strong>${esc(g.title)}</strong><span>${esc(g.description)}</span></a></li>`)
  .join('')}</ul>
<aside class="box"><h2>Check a deal</h2><p>Compare HMO, serviced accommodation and a provider lease on compliant profit.</p><a class="btn" href="/check">Open the deal check</a></aside>`;
writeFileSync(join(OUT, 'index.html'), page({ title: 'HMO guides for UK landlords | HMO Profit', description: 'Plain-English guides on the costs and rules that decide whether an HMO pays. Every fact is sourced.', canonical: `${SITE}/guides/`, body: index }));

const urls = ['/', '/check', '/provider-check', '/provider-review', '/provider-review/documents', '/guides/', ...guides.map((g) => `/guides/${g.slug}`), '/privacy-policy', '/terms'];
writeFileSync(
  join(ROOT, 'dist/sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${SITE}${u}</loc></url>`).join('\n')}\n</urlset>\n`,
);
console.log(`guides: built ${guides.length} guide(s) + index + sitemap`);
