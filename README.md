# HMO Profit — hmoprofit.co.uk

Compliance-adjusted profit for UK property. A deal check that compares a professional HMO, serviced accommodation and a lease to a supported housing provider on the profit left **after** the rules: licensing, Article 4, the Renters' Rights Act, the landlord register, EPC C by 2030 and supported housing licensing. Part of the SEA network alongside Support Audit, Exempt Accommodation and EPC Birmingham.

## Stack

- React 19 + Vite + TypeScript, Tailwind CSS v4
- GSAP (ScrollTrigger, SplitText, CustomEase) and Lenis for scroll and motion
- Geist / Geist Mono, self-hosted via Fontsource
- Static guides built from Markdown (`content/guides/*.md`) into crawlable HTML
- One Netlify Function at `/api/lead` (`netlify/functions/lead.mts` → `server/lead.ts`) for lead capture: Brevo contacts, provider review emails, optional Google Sheets webhook

Visual direction references DeepBook (black ground, electric blue `#1E6EF3`, slate `#6A7681`, off-white `#EFEFEB`, pinned split-panel scroll story, tick-field hero canvas, oversized footer wordmark). All motion respects `prefers-reduced-motion`.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173 (lead form unlocks without the API in dev)
npm test           # calculator maths
npm run build      # app + static guides + sitemap into dist/
```

## Deploy (Netlify)

Hosted on Netlify alongside the other APX sites. `netlify.toml` sets the build (`npm run build` → `dist`), Node 22, headers and the function.

Environment variables (Netlify → Project configuration → Environment variables, scope must include **Functions**):

| Variable | Value | Secret |
| --- | --- | --- |
| `BREVO_API_KEY` | A Brevo API key (SMTP & API → API keys) | Yes |
| `BREVO_LIST_ID` | ID of the "HMO Profit leads" list | No |
| `NOTIFY_EMAIL` | `info@hmoprofit.co.uk` (where provider review requests go) | No |
| `BREVO_SENDER_EMAIL` | `info@hmoprofit.co.uk` (domain is authenticated in Brevo) | No |
| `SHEETS_WEBHOOK_URL` | Optional: Google Apps Script web app URL | No |

Brevo needs the contact fields `ROLE` and `SOURCE` (text). If either is missing, or a phone number already belongs to another contact, the function retries without the phone, then with name only, so a lead is never lost.

Change an env var → redeploy for functions to pick it up.

### Domain

DNS for hmoprofit.co.uk is at Namecheap. In Netlify → Domain management add `hmoprofit.co.uk`, then at Namecheap point the apex `A` record to Netlify's load balancer and `www` `CNAME` to the Netlify subdomain, as Netlify shows. Keep Brevo's DKIM/SPF/DMARC records untouched.

## Where things live

| Path | What it is |
| --- | --- |
| `src/lib/calc.ts` | All the maths and the rule constants (`RULES`), each with its source. Change a date or fee here. |
| `src/lib/calc.test.ts` | Tests for the maths. Run them after any change to `calc.ts`. |
| `src/pages/Home.tsx` | Homepage sections and copy |
| `src/pages/Check.tsx` | The four-step deal check and result screen |
| `src/pages/ProviderCheck.tsx` | The 12-question provider lease scorecard |
| `src/pages/Report.tsx` | Free full report (print / save as PDF), opened by lead capture |
| `src/components/LeadForm.tsx` | Name, email, phone, role form used on the deal check and provider check |
| `src/lib/network.ts` | SEA network links and next-step routing |
| `src/pages/ProviderReview.tsx` | Paid provider review page and request form |
| `src/lib/service.ts` | Provider review price, scope and document list |
| `src/components/Fields.tsx` | Hero tick field and bar field canvases |
| `src/components/Iso.tsx` | Isometric line-art illustrations |
| `content/guides/` | One Markdown file per guide |

## Adding a guide

Create `content/guides/<slug>.md` with front matter (`title`, `description`, `published`, optional `seoTitle`, `kicker`, `updated`, `image`) and Markdown body. It is published at `/guides/<slug>` on the next build and added to the guides index and sitemap.

Images go in `public/guides/`. The existing guide expects `public/guides/register-your-rental-property-hmo.jpg`; copy it across from the old site.

## Provider review (paid service)

`/provider-review` sells a done-for-you check of a supported housing provider before a landlord signs their lease. `/provider-review/documents` is the document request a landlord sends the provider (copy, email or print).

- Price, turnaround, call length and call-back promise live in `src/lib/service.ts`, along with the four review areas and the document list.
- Requests are free and go to `/api/lead` with source `provider-review`: saved to Brevo and Sheets like other leads, and emailed to `NOTIFY_EMAIL` with reply-to set to the landlord.
- No payment on the site. Agree scope on the call, then invoice or send a Stripe Payment Link.
- Linked from the provider check (prominent when the score is under 20), the deal check and report for the provider-lease strategy, the homepage and the footer.

## Notes

- Everything is free. The three headline figures show straight away; the breakdown, checklist and printable full report open after name, email, UK phone number and role (consent required). Leads are tagged `deal-check` or `provider-check` with a results summary.
- The full report and the result screen route people into the SEA network (Support Audit, Exempt Accommodation, EPC Birmingham) based on their figures and role. Links live in `src/lib/network.ts`.
- Figures are illustrative and the rules modelled are for England.
