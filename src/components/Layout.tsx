import { Suspense, useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import SmoothScroll from './SmoothScroll';
import CookieBanner from './CookieBanner';
import { gsap, prefersReducedMotion } from '../lib/motion';

export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="7" fill="#1E6EF3" />
        <path d="M7 15 16 8l9 7v10H7z" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinejoin="round" />
        <path d="M13 25v-6h6v6" fill="none" stroke="#fff" strokeWidth="2.4" />
      </svg>
      <span className="text-[17px] font-medium tracking-tight">HMO Profit</span>
    </span>
  );
}

function AnnouncementBar() {
  const [open, setOpen] = useState(() => {
    try {
      return localStorage.getItem('hp-bar') !== 'closed';
    } catch {
      return true;
    }
  });
  if (!open) return null;
  return (
    <div className="no-print relative bg-signal text-center text-[13px] font-medium text-white">
      <Link to="/provider-check" className="block px-12 py-2.5 hover:underline">
        New: check a supported housing provider before you sign their lease →
      </Link>
      <button
        type="button"
        aria-label="Dismiss announcement"
        onClick={() => {
          setOpen(false);
          try {
            localStorage.setItem('hp-bar', 'closed');
          } catch {
            /* storage unavailable */
          }
        }}
        className="absolute top-1/2 right-2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded hover:bg-white/15"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
          <path d="M2 2l10 10M12 2 2 12" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      </button>
    </div>
  );
}

const links: { to: string; label: string; external?: boolean }[] = [
  { to: '/#how', label: 'How it works' },
  { to: '/#strategies', label: 'Strategies' },
  { to: '/provider-check', label: 'Provider check' },
  { to: '/guides/', label: 'Guides', external: true },
];

function Nav() {
  const [menu, setMenu] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setMenu(false), [pathname]);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    gsap.from('[data-nav]', { y: -24, autoAlpha: 0, duration: 1, ease: 'expo', delay: 0.15 });
  }, []);

  return (
    <div className="no-print sticky top-3 z-50 px-3">
      <nav
        data-nav
        aria-label="Main"
        className="mx-auto flex max-w-[760px] items-center justify-between gap-4 rounded-[10px] border border-white/10 bg-[#141618]/85 py-1.5 pr-1.5 pl-4 backdrop-blur-md"
      >
        <Link to="/" aria-label="HMO Profit home">
          <Logo />
        </Link>
        <ul className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <li key={l.label}>
              {l.external ? (
                <a href={l.to} className="rounded-md px-3 py-2.5 text-[14px] text-white/80 hover:text-white">
                  {l.label}
                </a>
              ) : (
                <NavLink to={l.to} className="rounded-md px-3 py-2.5 text-[14px] text-white/80 hover:text-white">
                  {l.label}
                </NavLink>
              )}
            </li>
          ))}
          <li>
            <Link to="/check" className="btn btn-signal ml-1 !min-h-[40px] !px-4 !text-[14px]">
              Check a deal
            </Link>
          </li>
        </ul>
        <button
          type="button"
          className="grid h-11 w-11 place-items-center rounded-md md:hidden"
          aria-expanded={menu}
          aria-controls="mobile-menu"
          aria-label={menu ? 'Close menu' : 'Open menu'}
          onClick={() => setMenu((m) => !m)}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" stroke="currentColor" strokeWidth="1.6">
            {menu ? <path d="M4 4l12 12M16 4 4 16" /> : <path d="M3 6h14M3 14h14" />}
          </svg>
        </button>
      </nav>
      {menu && (
        <ul
          id="mobile-menu"
          className="mx-auto mt-2 flex max-w-[760px] flex-col rounded-[10px] border border-white/10 bg-[#141618] p-2 md:hidden"
        >
          {links.map((l) => (
            <li key={l.label}>
              {l.external ? (
                <a href={l.to} className="block rounded-md px-3 py-3 text-white/85">
                  {l.label}
                </a>
              ) : (
                <Link to={l.to} className="block rounded-md px-3 py-3 text-white/85">
                  {l.label}
                </Link>
              )}
            </li>
          ))}
          <li className="p-1">
            <Link to="/check" className="btn btn-signal w-full">
              Check a deal
            </Link>
          </li>
        </ul>
      )}
    </div>
  );
}

function FooterCol({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-3 text-[13px] text-white/70">{title}</p>
      <ul className="space-y-1.5 text-[14px] font-medium">{children}</ul>
    </div>
  );
}

function Footer() {
  return (
    <footer className="no-print overflow-hidden bg-signal text-white">
      <div className="wrap grid gap-12 pt-20 md:grid-cols-[1fr_2fr]">
        <div>
          <Logo />
          <p className="mt-5 max-w-sm text-[14px] leading-relaxed text-white/85">
            Figures are illustrative estimates and are not financial, investment, tax or legal advice. Rules shown apply to
            England. Take independent advice before buying or letting property.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
          <FooterCol title="Tools">
            <li><Link to="/check" className="hover:underline">Deal check</Link></li>
            <li><Link to="/provider-check" className="hover:underline">Provider lease check</Link></li>
            <li><Link to="/provider-review" className="hover:underline">Provider review</Link></li>
            <li><a href="/guides/" className="hover:underline">Guides</a></li>
          </FooterCol>
          <FooterCol title="SEA network">
            <li><a href="https://supportaudit.co.uk" className="hover:underline">Support Audit</a></li>
            <li><a href="https://exemptaccommodation.com" className="hover:underline">Exempt Accommodation</a></li>
            <li><a href="https://epcbirmingham.co.uk" className="hover:underline">EPC Birmingham</a></li>
          </FooterCol>
          <FooterCol title="Legal">
            <li><Link to="/privacy-policy" className="hover:underline">Privacy policy</Link></li>
            <li><Link to="/terms" className="hover:underline">Terms of use</Link></li>
            <li><a href="mailto:info@hmoprofit.co.uk" className="hover:underline">info@hmoprofit.co.uk</a></li>
          </FooterCol>
        </div>
      </div>
      <div className="wrap mt-16 flex flex-wrap justify-between gap-2 text-[12px] text-white/75">
        <span>© {new Date().getFullYear()} Apex Digital Enterprise</span>
        <span>Built in the West Midlands</span>
      </div>
      <p
        aria-hidden="true"
        className="display mt-6 -mb-[0.2em] text-center text-[clamp(84px,19.5vw,330px)] leading-[0.8] whitespace-nowrap select-none"
      >
        HMO Profit
      </p>
    </footer>
  );
}

export default function Layout() {
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:text-black">
        Skip to content
      </a>
      <SmoothScroll />
      <AnnouncementBar />
      <Nav />
      <main id="main">
        <Suspense fallback={<div className="min-h-[70vh]" />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <CookieBanner />
    </>
  );
}
