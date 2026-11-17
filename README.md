# HMO Profit — hmoprofit.co.uk

Compliance-adjusted profit for UK property. A deal check that compares a professional HMO, serviced accommodation and a lease to a supported housing provider on the profit left **after** the rules: licensing, Article 4, the Renters' Rights Act, the landlord register, EPC C by 2030 and supported housing licensing. Part of the SEA network alongside Support Audit, Exempt Accommodation and EPC Birmingham.

## Stack

- React 19 + Vite + TypeScript, Tailwind CSS v4
- GSAP (ScrollTrigger, SplitText, CustomEase) and Lenis for scroll and motion
- Geist / Geist Mono, self-hosted via Fontsource
- Static guides built from Markdown (`content/guides/*.md`) into crawlable HTML
- One Cloudflare Pages Function, `functions/api/lead.ts`, for lead capture (Brevo + optional Google Sheets webhook)

Visual direction references DeepBook (black ground, electric blue `#1E6EF3`, slate `#6A7681`, off-white `#EFEFEB`, pinned split-panel scroll story, tick-field hero canvas, oversized footer wordmark). All motion respects `prefers-reduced-motion`.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173 (lead form unlocks without the API in dev)
npm test           # calculator maths
npm run build      # app + static guides + sitemap into dist/
```

## Deploy (Cloudflare Pages)

1. Cloudflare dashboard → Workers & Pages → Create → Pages → connect `Jamiemac9/hmoprofit`.
2. Build command `npm run build`, output directory `dist`. The `functions/` folder is picked up automatically.
3. Environment variables (Production):
   - `VITE_STRIPE_PAYMENT_LINK` – your Stripe Payment Link for the £9 report
   - `VITE_REPORT_PRICE` – e.g. `£9`
   - `BREVO_API_KEY`, `BREVO_LIST_ID` – where leads go
   - `SHEETS_WEBHOOK_URL` – optional, e.g. a Google Apps Script web app that appends a row
4. In Stripe, set the Payment Link's confirmation page to redirect to `https://hmoprofit.co.uk/report?paid=1`.
5. Add the custom domain `hmoprofit.co.uk` in Pages and switch DNS from the old host once you're happy.

## Where things live

| Path | What it is |
| --- | --- |
| `src/lib/calc.ts` | All the maths and the rule constants (`RULES`), each with its source. Change a date or fee here. |
| `src/lib/calc.test.ts` | Tests for the maths. Run them after any change to `calc.ts`. |
| `src/pages/Home.tsx` | Homepage sections and copy |
| `src/pages/Check.tsx` | The four-step deal check and result screen |
| `src/pages/ProviderCheck.tsx` | The 12-question provider lease scorecard |
| `src/pages/Report.tsx` | Paid full report (print / save as PDF) |
| `src/components/Fields.tsx` | Hero tick field and bar field canvases |
| `src/components/Iso.tsx` | Isometric line-art illustrations |
| `content/guides/` | One Markdown file per guide |

## Adding a guide

Create `content/guides/<slug>.md` with front matter (`title`, `description`, `published`, optional `seoTitle`, `kicker`, `updated`, `image`) and Markdown body. It is published at `/guides/<slug>` on the next build and added to the guides index and sitemap.

Images go in `public/guides/`. The existing guide expects `public/guides/register-your-rental-property-hmo.jpg`; copy it across from the old site.

## Notes

- The free result shows the three headline figures. The line-by-line breakdown and checklist unlock after name + email (consent required), matching the privacy policy and terms.
- The paid report unlocks client-side after the Stripe redirect. For server-side verification, swap the Payment Link for Stripe Checkout Sessions in a Pages Function.
- Figures are illustrative and the rules modelled are for England.
