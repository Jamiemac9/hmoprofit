import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { CustomEase } from 'gsap/CustomEase';

gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);
CustomEase.create('expo', '0.16, 1, 0.3, 1');

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Wires the scroll-driven motion inside `scope`:
 *  [data-split]  – headline lines rise out of a mask
 *  [data-reveal] – blocks fade up, staggered in batches
 *  [data-count]  – numbers count up to their value (data-count="1234", data-prefix="£")
 */
export function setupReveals(scope: HTMLElement): () => void {
  if (prefersReducedMotion()) return () => {};
  const ctx = gsap.context(() => {
    scope.querySelectorAll<HTMLElement>('[data-split]').forEach((el) => {
      const split = SplitText.create(el, { type: 'lines', mask: 'lines', linesClass: 'split-line-inner' });
      gsap.from(split.lines, {
        yPercent: 110,
        duration: 1.2,
        ease: 'expo',
        stagger: 0.08,
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      });
    });

    const reveals = gsap.utils.toArray<HTMLElement>('[data-reveal]', scope);
    gsap.set(reveals, { opacity: 0, y: 40 });
    ScrollTrigger.batch(reveals, {
      start: 'top 90%',
      once: true,
      onEnter: (batch) =>
        gsap.to(batch, { opacity: 1, y: 0, duration: 1, ease: 'expo', stagger: 0.08, overwrite: true }),
    });

    scope.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => {
      const target = Number(el.dataset.count);
      const prefix = el.dataset.prefix ?? '';
      const suffix = el.dataset.suffix ?? '';
      const obj = { v: 0 };
      gsap.to(obj, {
        v: target,
        duration: 1.6,
        ease: 'expo',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
        onUpdate: () => {
          const v = Math.round(obj.v);
          el.textContent = `${v < 0 ? '−' : ''}${prefix}${Math.abs(v).toLocaleString('en-GB')}${suffix}`;
        },
      });
    });
  }, scope);
  return () => ctx.revert();
}

export { gsap, ScrollTrigger };
