import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '../lib/motion';

/** Shared canvas loop: DPR-aware, pauses off-screen, single static frame under reduced motion. */
function useCanvasLoop(draw: (ctx: CanvasRenderingContext2D, w: number, h: number, t: number, pointer: { x: number; y: number; on: boolean }) => void) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let w = 0;
    let h = 0;
    let raf = 0;
    let visible = true;
    const pointer = { x: -9999, y: -9999, on: false };
    const reduced = prefersReducedMotion();
    const start = performance.now();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (reduced) draw(ctx, w, h, 4, pointer);
    };
    const frame = (now: number) => {
      if (visible) draw(ctx, w, h, (now - start) / 1000, pointer);
      raf = requestAnimationFrame(frame);
    };
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
      pointer.on = pointer.y >= 0 && pointer.y <= r.height;
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
    io.observe(canvas);
    resize();
    if (!reduced) {
      raf = requestAnimationFrame(frame);
      window.addEventListener('pointermove', onMove, { passive: true });
    }
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('pointermove', onMove);
    };
  }, [draw]);
  return ref;
}

/**
 * Hero field: a grid of short vertical ticks. Bands of ticks light up as ripples
 * travel out from below the fold, like rent rolling in; the pointer pulls ticks blue.
 */
const drawTicks = (ctx: CanvasRenderingContext2D, w: number, h: number, t: number, p: { x: number; y: number; on: boolean }) => {
  ctx.clearRect(0, 0, w, h);
  const gx = w < 700 ? 16 : 20;
  const gy = 24;
  const len = 11;
  const ox = w / 2;
  const oy = h * 1.55;
  for (let x = gx / 2; x < w; x += gx) {
    for (let y = gy / 2; y < h; y += gy) {
      const dist = Math.hypot(x - ox, (y - oy) * 1.25);
      const band = Math.sin(dist * 0.021 - t * 1.1);
      const shimmer = Math.sin(x * 0.05 + t * 0.7) * 0.15;
      let a = band + shimmer - 0.2;
      if (a <= 0) continue;
      a = Math.min(1, a * 1.6);
      // fade towards the bottom where the headline sits
      const fade = 1 - Math.max(0, (y - h * 0.55) / (h * 0.45));
      a *= Math.max(0, fade);
      if (a < 0.03) continue;
      let blue = false;
      let l = len;
      if (p.on) {
        const d = Math.hypot(x - p.x, y - p.y);
        if (d < 120) {
          const k = 1 - d / 120;
          blue = k > 0.35;
          l = len + k * 10;
          a = Math.max(a, k);
        }
      }
      ctx.fillStyle = blue ? `rgba(30,110,243,${a})` : `rgba(170,180,190,${a * 0.9})`;
      ctx.fillRect(x - 0.75, y - l / 2, 1.5, l);
    }
  }
};

export function HeroField({ className = '' }: { className?: string }) {
  const ref = useCanvasLoop(drawTicks);
  return <canvas ref={ref} aria-hidden="true" className={className} />;
}

/** Bars rising from both edges, breathing like a slow bar chart. */
const drawBars = (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => {
  ctx.clearRect(0, 0, w, h);
  const bw = w < 700 ? 6 : 9;
  const gap = w < 700 ? 9 : 14;
  const perSide = Math.floor((w * 0.24) / (bw + gap));
  for (let side = 0; side < 2; side++) {
    for (let i = 0; i < perSide; i++) {
      const x = side === 0 ? i * (bw + gap) + gap : w - (i + 1) * (bw + gap);
      const edge = 1 - i / perSide; // taller near the edges
      const wave = 0.55 + 0.45 * Math.sin(t * 0.9 + i * 0.7 + side * 2.1);
      const bh = h * (0.18 + 0.7 * edge * edge * wave);
      const g = ctx.createLinearGradient(0, h - bh, 0, h);
      g.addColorStop(0, `rgba(30,110,243,${0.15 + 0.6 * edge})`);
      g.addColorStop(1, 'rgba(30,110,243,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x, (h - bh) / 2, bw, bh);
    }
  }
};

export function BarsField({ className = '' }: { className?: string }) {
  const ref = useCanvasLoop(drawBars);
  return <canvas ref={ref} aria-hidden="true" className={className} />;
}
