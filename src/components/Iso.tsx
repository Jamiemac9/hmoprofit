/**
 * Small isometric line-art kit: black strokes, white faces, blue accents.
 * World units: x right-down, y left-down, z up.
 */
import type { ReactNode } from 'react';

const C = Math.cos(Math.PI / 6);
const S = 0.5;
const STROKE = '#000';
const SW = 1.6;

export const BLUE = '#1E6EF3';
export const SHADE = '#D9D9D9';
export const WHITE = '#FFFFFF';

type P = [number, number];

function pt(x: number, y: number, z: number, u = 10): P {
  return [(x - y) * C * u, (x + y) * S * u - z * u];
}
const poly = (pts: P[]) => pts.map((p) => p.map((n) => n.toFixed(2)).join(',')).join(' ');

interface BoxProps {
  x: number;
  y: number;
  z?: number;
  w: number;
  d: number;
  h: number;
  top?: string;
  left?: string;
  right?: string;
}

export function Box({ x, y, z = 0, w, d, h, top = WHITE, left = WHITE, right = SHADE }: BoxProps) {
  const t = [pt(x, y, z + h), pt(x + w, y, z + h), pt(x + w, y + d, z + h), pt(x, y + d, z + h)];
  const l = [pt(x, y + d, z), pt(x + w, y + d, z), pt(x + w, y + d, z + h), pt(x, y + d, z + h)];
  const r = [pt(x + w, y, z), pt(x + w, y + d, z), pt(x + w, y + d, z + h), pt(x + w, y, z + h)];
  return (
    <g stroke={STROKE} strokeWidth={SW} strokeLinejoin="round">
      <polygon points={poly(l)} fill={left} />
      <polygon points={poly(r)} fill={right} />
      <polygon points={poly(t)} fill={top} />
    </g>
  );
}

/** Gable roof running along x, sitting at height z. */
export function Roof({ x, y, z, w, d, rise, fill = WHITE, side = SHADE }: { x: number; y: number; z: number; w: number; d: number; rise: number; fill?: string; side?: string }) {
  const ridgeY = y + d / 2;
  const gableFront = [pt(x + w, y, z), pt(x + w, y + d, z), pt(x + w, ridgeY, z + rise)];
  const slopeNear = [pt(x, y + d, z), pt(x + w, y + d, z), pt(x + w, ridgeY, z + rise), pt(x, ridgeY, z + rise)];
  return (
    <g stroke={STROKE} strokeWidth={SW} strokeLinejoin="round">
      <polygon points={poly(slopeNear)} fill={fill} />
      <polygon points={poly(gableFront)} fill={side} />
    </g>
  );
}

/** Windows on the left (y = y+d) face of a box. */
export function Windows({ x, y, z, w, d, rows, cols, fill = BLUE }: { x: number; y: number; z: number; w: number; d: number; rows: number; cols: number; fill?: string }) {
  const out: ReactNode[] = [];
  const gx = w / cols;
  const gz = 1.6;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x0 = x + c * gx + gx * 0.28;
      const x1 = x0 + gx * 0.44;
      const z0 = z + 0.6 + r * gz;
      const z1 = z0 + 0.9;
      out.push(
        <polygon
          key={`${r}-${c}`}
          points={poly([pt(x0, y + d, z0), pt(x1, y + d, z0), pt(x1, y + d, z1), pt(x0, y + d, z1)])}
          fill={fill}
          stroke={STROKE}
          strokeWidth={1.1}
        />,
      );
    }
  }
  return <g>{out}</g>;
}

/** A stack of discs (coins), centred at (x, y). */
export function Coins({ x, y, z = 0, r = 1.4, count, fill = WHITE, topFill = WHITE }: { x: number; y: number; z?: number; r?: number; count: number; fill?: string; topFill?: string }) {
  const out: ReactNode[] = [];
  const t = 0.42;
  for (let i = 0; i < count; i++) {
    const [cx, cy] = pt(x, y, z + i * t);
    const rx = r * 10 * C * 1.414;
    const ry = rx * 0.5774;
    const h = t * 10;
    out.push(
      <g key={i} stroke={STROKE} strokeWidth={1.2}>
        <path d={`M${cx - rx},${cy} L${cx - rx},${cy - h} A${rx},${ry} 0 0 0 ${cx + rx},${cy - h} L${cx + rx},${cy} A${rx},${ry} 0 0 1 ${cx - rx},${cy} Z`} fill={fill} />
        <ellipse cx={cx} cy={cy - h} rx={rx} ry={ry} fill={i === count - 1 ? topFill : fill} />
      </g>,
    );
  }
  return <g>{out}</g>;
}

export function IsoSvg({ children, label, viewBox = '-165 -218 330 312' }: { children: ReactNode; label: string; viewBox?: string }) {
  return (
    <svg viewBox={viewBox} role="img" aria-label={label} className="h-full w-full">
      {children}
    </svg>
  );
}

/** House on a blue plinth, reused by the scenes. */
export function House({ dx = 0, dy = 0, rows = 2 }: { dx?: number; dy?: number; rows?: number }) {
  const h = rows * 1.6 + 0.8;
  return (
    <g>
      <Box x={-6 + dx} y={-6 + dy} w={12} d={12} h={1.2} top={BLUE} left={BLUE} right="#1557C7" />
      <Box x={-4 + dx} y={-3.5 + dy} z={1.2} w={8} d={7} h={h} />
      <Windows x={-4 + dx} y={-3.5 + dy} z={1.2} w={8} d={7} rows={rows} cols={3} />
      <Roof x={-4.4 + dx} y={-3.9 + dy} z={1.2 + h} w={8.8} d={7.8} rise={3.2} />
    </g>
  );
}

export function SceneHeadline() {
  return (
    <IsoSvg label="A house on a plinth beside a tall stack of coins">
      <House dx={-2} />
      <Coins x={5} y={-4} z={1.2} count={14} topFill={BLUE} />
    </IsoSvg>
  );
}

export function SceneLoad() {
  return (
    <IsoSvg label="Compliance layers lifting off above the house: licence, fire safety, energy">
      <House dx={-2} />
      <g>
        <Box x={-6.6} y={-4} z={10.6} w={9} d={8} h={0.6} top={WHITE} />
        <Box x={-6.6} y={-4} z={12.6} w={9} d={8} h={0.6} top={BLUE} left={BLUE} right="#1557C7" />
        <Box x={-6.6} y={-4} z={14.6} w={9} d={8} h={0.6} top={WHITE} />
      </g>
      <Coins x={5} y={-4} z={1.2} count={7} />
    </IsoSvg>
  );
}

export function SceneCompliant() {
  return (
    <IsoSvg label="The house on its plinth with a smaller, solid stack of coins and a blue tick">
      <House dx={-2} />
      <Coins x={5} y={-4} z={1.2} count={6} fill={BLUE} topFill={BLUE} />
      <g transform="translate(92 -120)">
        <circle r="17" fill={BLUE} stroke={STROKE} strokeWidth={SW} />
        <path d="M-7 0l5 5 9-10" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </IsoSvg>
  );
}

export function MiniHmo() {
  return (
    <IsoSvg label="Tall shared house" viewBox="-110 -150 220 200">
      <Box x={-6} y={-6} w={12} d={12} h={1} top="#2A2F34" left="#2A2F34" right="#1B1E21" />
      <Box x={-4} y={-3.5} z={1} w={8} d={7} h={6.6} />
      <Windows x={-4} y={-3.5} z={1} w={8} d={7} rows={3} cols={3} />
      <Roof x={-4.4} y={-3.9} z={7.6} w={8.8} d={7.8} rise={3.2} />
    </IsoSvg>
  );
}

export function MiniSa() {
  return (
    <IsoSvg label="House with a suitcase" viewBox="-110 -150 220 200">
      <Box x={-6} y={-6} w={12} d={12} h={1} top="#2A2F34" left="#2A2F34" right="#1B1E21" />
      <Box x={-5} y={-3.5} z={1} w={6} d={6} h={3.4} />
      <Windows x={-5} y={-3.5} z={1} w={6} d={6} rows={1} cols={2} />
      <Roof x={-5.4} y={-3.9} z={4.4} w={6.8} d={6.8} rise={2.6} />
      <Box x={2.5} y={-1} z={1} w={2.6} d={1.4} h={3.2} top={BLUE} left={BLUE} right="#1557C7" />
    </IsoSvg>
  );
}

export function MiniSh() {
  return (
    <IsoSvg label="House linked to a provider block" viewBox="-110 -150 220 200">
      <Box x={-6} y={-6} w={12} d={12} h={1} top="#2A2F34" left="#2A2F34" right="#1B1E21" />
      <Box x={-5} y={-4} z={1} w={6} d={6} h={4} />
      <Windows x={-5} y={-4} z={1} w={6} d={6} rows={2} cols={2} />
      <Roof x={-5.4} y={-4.4} z={5} w={6.8} d={6.8} rise={2.6} />
      <Box x={2.4} y={-1.5} z={1} w={2.6} d={2.6} h={2.6} top={BLUE} left={BLUE} right="#1557C7" />
      <Box x={2.4} y={-1.5} z={4.2} w={2.6} d={2.6} h={0.8} top={WHITE} />
    </IsoSvg>
  );
}
