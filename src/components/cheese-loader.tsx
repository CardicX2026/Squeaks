"use client";
import { useEffect, useState } from "react";

/** Cheese wedge that fills from the bottom while a game loads. Shared by every game. */
export function CheeseLoader({ p, label, tips }: { p: number; label: string; tips: string[] }) {
  const [tip, setTip] = useState(0);
  const [shown, setShown] = useState(0);
  useEffect(() => { const t = setInterval(() => setTip((i) => (i + 1) % tips.length), 2200); return () => clearInterval(t); }, [tips.length]);
  useEffect(() => {
    const t = setInterval(() => setShown((v) => Math.min(Math.max(p, Math.min(0.9, v + 0.004)), v + Math.max(0.006, (p - v) * 0.2))), 30);
    return () => clearInterval(t);
  }, [p]);
  const pct = Math.round(Math.min(1, shown) * 100);
  return (
    <div className="loader" role="status" aria-label={`Loading ${pct}%`}>
      <svg viewBox="0 0 120 100" aria-hidden>
        <defs><clipPath id="wedge"><path d="M8 62 92 18a10 10 0 0 1 20 6v54a8 8 0 0 1-8 8H16a8 8 0 0 1-8-8z" /></clipPath></defs>
        <path d="M8 62 92 18a10 10 0 0 1 20 6v54a8 8 0 0 1-8 8H16a8 8 0 0 1-8-8z" fill="rgba(255,255,255,0.08)" stroke="rgba(255,200,61,0.5)" strokeWidth="2" />
        <g clipPath="url(#wedge)">
          <rect x="0" y={100 - pct} width="120" height="100" fill="#ffc83d" />
          <rect x="0" y={100 - pct} width="120" height="4" fill="#ffe27a" />
          <circle cx="34" cy="70" r="7" fill="#e09a00" /><circle cx="70" cy="58" r="6" fill="#e09a00" /><circle cx="92" cy="74" r="5" fill="#e09a00" /><circle cx="98" cy="40" r="4" fill="#e09a00" />
        </g>
      </svg>
      <b>{pct}%</b>
      <div className="lbar"><i style={{ width: `${pct}%` }} /></div>
      <p className="tip">{label} {tips[tip]}</p>
    </div>
  );
}

/** Loads a list of images and reports progress from 0 to 1 (never blocks on a broken image). */
export function useImagePreload(srcs: string[]) {
  const [p, setP] = useState(0);
  const key = srcs.join("|");
  useEffect(() => {
    let done = 0, dead = false;
    const list = key.split("|").filter(Boolean);
    if (!list.length) { setP(1); return; }
    for (const src of list) {
      const im = new Image();
      im.onload = im.onerror = () => { done++; if (!dead) setP(done / list.length); };
      im.src = src;
    }
    return () => { dead = true; };
  }, [key]);
  return p;
}
