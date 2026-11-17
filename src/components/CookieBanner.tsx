import { useState } from 'react';
import { Link } from 'react-router-dom';

const KEY = 'hp-consent';

export type Consent = 'all' | 'essential';

export function getConsent(): Consent | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'all' || v === 'essential' ? v : null;
  } catch {
    return null;
  }
}

/**
 * Essential storage only (cookie choice, calculator progress). Analytics or marketing
 * scripts must check getConsent() === 'all' before loading.
 */
export default function CookieBanner() {
  const [choice, setChoice] = useState<Consent | null>(() => getConsent());
  if (choice) return null;
  const save = (c: Consent) => {
    try {
      localStorage.setItem(KEY, c);
    } catch {
      /* storage unavailable */
    }
    setChoice(c);
    window.dispatchEvent(new CustomEvent('hp-consent', { detail: c }));
  };
  return (
    <div
      role="region"
      aria-label="Cookie choices"
      className="no-print fixed inset-x-3 bottom-3 z-[70] mx-auto flex max-w-[760px] flex-wrap items-center gap-4 rounded-[10px] border border-white/10 bg-[#141618]/95 p-4 text-[14px] backdrop-blur-md"
    >
      <p className="min-w-0 flex-[999_1_320px] leading-relaxed text-white/85">
        We use essential storage to save your progress, plus optional analytics to improve the tool. See our{' '}
        <Link to="/privacy-policy" className="underline">privacy policy</Link>.
      </p>
      <div className="flex flex-1 flex-wrap gap-2">
        <button type="button" className="btn btn-ghost flex-1 whitespace-nowrap" onClick={() => save('essential')}>
          Reject non-essential
        </button>
        <button type="button" className="btn btn-light flex-1 whitespace-nowrap" onClick={() => save('all')}>
          Accept all
        </button>
      </div>
    </div>
  );
}
