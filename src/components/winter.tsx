/* Original winter decorations drawn in code: six-armed snowflakes and piled-snow caps. */
import type { CSSProperties } from "react";

/** A six-fold snowflake. `v` picks the style (tips, branches, centre). */
export function Flake({ v = 0, size = 64, style, className = "" }: { v?: number; size?: number; style?: CSSProperties; className?: string }) {
  const R = 46;
  const tip = v % 4; // 0 diamond, 1 dot, 2 fork, 3 arrow
  const arm: string[] = [`M0 0 L0 -${R}`];
  const br = v % 3 === 0 ? [0.42, 0.7] : v % 3 === 1 ? [0.35, 0.58, 0.8] : [0.55];
  for (const k of br) {
    const y = -R * k, len = (v % 3 === 2 ? 18 : 12) * (1.15 - k * 0.5);
    arm.push(`M0 ${y} l${-len * 0.7} ${-len * 0.7} M0 ${y} l${len * 0.7} ${-len * 0.7}`);
  }
  if (tip === 0) arm.push(`M0 -${R + 7} l5 5 -5 5 -5 -5z`);
  if (tip === 2) arm.push(`M0 -${R - 4} l-5 -6 M0 -${R - 4} l5 -6`);
  if (tip === 3) arm.push(`M-5 -${R - 6} L0 -${R} L5 -${R - 6}`);
  const d = arm.join(" ");
  return (
    <svg className={`flake ${className}`} width={size} height={size} viewBox="-60 -60 120 120" style={style} aria-hidden>
      <g fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
        {[0, 60, 120, 180, 240, 300].map((a) => (
          <g key={a} transform={`rotate(${a})`}>
            <path d={d} />
            {tip === 1 && <circle cx="0" cy={-R - 4} r="4.5" fill="currentColor" stroke="none" />}
          </g>
        ))}
        {v % 2 === 0 ? <path d="M0 -12 L10.4 -6 L10.4 6 L0 12 L-10.4 6 L-10.4 -6z" /> : <circle r="7" />}
      </g>
    </svg>
  );
}

/** A handful of large, slowly turning flakes for section backgrounds. */
export function FlakeField({ seed = 0, n = 6, className = "" }: { seed?: number; n?: number; className?: string }) {
  const spots = [
    [6, 12], [88, 8], [72, 62], [14, 70], [46, 28], [94, 86], [30, 92], [58, 84],
  ];
  return (
    <div className={`flakes-bg ${className}`} aria-hidden>
      {spots.slice(0, n).map(([x, y], i) => {
        const v = (i + seed) % 6, size = 56 + ((i * 37 + seed * 11) % 70);
        return <Flake key={i} v={v} size={size} style={{ left: `${x}%`, top: `${y}%`, animationDuration: `${40 + i * 9}s`, animationDirection: i % 2 ? "reverse" : "normal" }} />;
      })}
    </div>
  );
}

/** Heavy snow piled on an edge: puffy lumps above the line and drips hanging over it. */
export function SnowCap({ seed = 0, className = "" }: { seed?: number; className?: string }) {
  // deterministic pseudo-random so server and client render the same shape
  let r = seed * 9301 + 49297;
  const rnd = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
  const W = 400, BASE = 34;
  let top = `M0 ${BASE - 6}`;
  let x = 0;
  while (x < W) {
    const w = 34 + rnd() * 40, h = 12 + rnd() * 16, nx = Math.min(W, x + w);
    top += ` C ${x + w * 0.15} ${BASE - h - 6}, ${x + w * 0.85} ${BASE - h - 6}, ${nx} ${BASE - 8 + rnd() * 4}`;
    x = nx;
  }
  let bottom = ` L${W} ${BASE + 4}`;
  const drips = [0.12, 0.31, 0.47, 0.66, 0.83].map((k) => k + (rnd() - 0.5) * 0.06);
  for (let i = drips.length - 1; i >= 0; i--) {
    const cx = drips[i] * W, dw = 8 + rnd() * 8, dl = 8 + rnd() * 14;
    bottom += ` L${cx + dw} ${BASE + 4} C ${cx + dw} ${BASE + 4 + dl}, ${cx - dw} ${BASE + 4 + dl}, ${cx - dw} ${BASE + 4}`;
  }
  bottom += ` L0 ${BASE + 4}z`;
  return (
    <svg className={`snowcap ${className}`} viewBox={`0 0 ${W} 62`} preserveAspectRatio="none" aria-hidden>
      <path d={top + bottom} fill="#d4e6fa" transform="translate(0 3)" />
      <path d={top + bottom} fill="#ffffff" />
      <path d={`${top} L${W} ${BASE - 2} C ${W * 0.7} ${BASE - 10}, ${W * 0.3} ${BASE - 10}, 0 ${BASE - 2}z`} fill="#f4f9ff" opacity="0.9" transform="translate(0 6)" />
    </svg>
  );
}
