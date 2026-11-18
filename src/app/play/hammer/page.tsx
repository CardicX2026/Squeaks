"use client";
/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useRef, useState } from "react";
import { MiniMenu, MiniResult, MiniShell, useMiniRun, type Result } from "@/components/minigame";
import { audio } from "@/game/audio";
import { fmt } from "@/components/ui";

const ROUND_MS = 45_000;
const MICE = Array.from({ length: 24 }, (_, i) => `/nft/n${String(i + 1).padStart(2, "0")}.webp`);
type Kind = "mouse" | "gold" | "trap";
type Hole = { id: number; kind: Kind; img: string; until: number; hit?: boolean };
type Pop = { id: number; x: number; y: number; text: string; cls: string };

/** Original golden hammer, drawn in code. */
function Hammer() {
  return (
    <svg viewBox="0 0 64 64" width="64" height="64" aria-hidden>
      <rect x="29" y="22" width="7" height="38" rx="3" fill="#1b2a5c" transform="rotate(-30 32 40)" />
      <rect x="29" y="40" width="7" height="14" rx="3" fill="#3a8dde" transform="rotate(-30 32 40)" />
      <g transform="rotate(-30 32 20)">
        <rect x="12" y="10" width="40" height="18" rx="5" fill="#ffc83d" stroke="#b97700" strokeWidth="2" />
        <rect x="8" y="12" width="8" height="14" rx="3" fill="#ffe27a" stroke="#b97700" strokeWidth="2" />
        <rect x="48" y="12" width="8" height="14" rx="3" fill="#ffe27a" stroke="#b97700" strokeWidth="2" />
        <rect x="18" y="13" width="16" height="3" rx="1.5" fill="#fff4c2" />
      </g>
    </svg>
  );
}
/** Original mousetrap, drawn in code. */
function Trap() {
  return (
    <svg viewBox="0 0 80 80" width="100%" height="100%" aria-hidden>
      <rect x="8" y="34" width="64" height="34" rx="6" fill="#c8894a" stroke="#7a4f22" strokeWidth="3" />
      <rect x="14" y="40" width="52" height="22" rx="3" fill="#b5773d" />
      <path d="M18 60 L62 60 L62 30 L18 30 Z" fill="none" stroke="#d6dbe8" strokeWidth="4" strokeLinejoin="round" />
      <circle cx="40" cy="52" r="5" fill="#9aa6c4" />
      <path d="M44 50 l10 -6 l4 6 l-12 4z" fill="#ffc83d" />
      <circle cx="51" cy="49" r="1.6" fill="#e09a00" />
    </svg>
  );
}

export default function HammerGame() {
  const run = useMiniRun("hammer");
  const [phase, setPhase] = useState<"menu" | "play" | "over">("menu");
  const [holes, setHoles] = useState<(Hole | null)[]>(Array(9).fill(null));
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [left, setLeft] = useState(ROUND_MS);
  const [pops, setPops] = useState<Pop[]>([]);
  const [swing, setSwing] = useState<{ x: number; y: number; k: number } | null>(null);
  const [shake, setShake] = useState(false);
  const [res, setRes] = useState<Result | null>(null);
  const st = useRef({ start: 0, nextSpawn: 0, score: 0, combo: 0, id: 0, holes: Array(9).fill(null) as (Hole | null)[], over: false });
  const board = useRef<HTMLDivElement>(null);
  const mult = 1 + Math.min(3, Math.floor(combo / 5));

  const end = useCallback(async () => {
    if (st.current.over) return;
    st.current.over = true;
    setPhase("over");
    setRes({ score: st.current.score, best: false, credited: null });
    setRes(await run.finish(st.current.score));
  }, [run]);

  // game loop: spawn, expire, timer (speeds up as the round goes on)
  useEffect(() => {
    if (phase !== "play") return;
    let raf = 0;
    const tick = () => {
      const s = st.current, now = performance.now(), el = now - s.start, k = Math.min(1, el / ROUND_MS);
      setLeft(Math.max(0, ROUND_MS - el));
      if (el >= ROUND_MS) { end(); return; }
      let changed = false;
      s.holes = s.holes.map((h) => { if (h && now > h.until) { changed = true; if (!h.hit && h.kind !== "trap") s.combo = 0; return null; } return h; });
      if (now >= s.nextSpawn) {
        const free = s.holes.map((h, i) => (h ? -1 : i)).filter((i) => i >= 0);
        const count = k > 0.6 && Math.random() < 0.4 ? 2 : 1;
        for (let c = 0; c < count && free.length; c++) {
          const i = free.splice(Math.floor(Math.random() * free.length), 1)[0];
          const r = Math.random();
          const kind: Kind = r < 0.15 + k * 0.08 ? "trap" : r < 0.24 + k * 0.08 ? "gold" : "mouse";
          s.holes[i] = { id: ++s.id, kind, img: MICE[Math.floor(Math.random() * MICE.length)], until: now + (1150 - k * 600) * (kind === "gold" ? 0.75 : 1) };
        }
        s.nextSpawn = now + 900 - k * 520;
        changed = true;
      }
      if (changed) { setHoles([...s.holes]); setCombo(s.combo); }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, end]);

  const startRound = (asGuest: boolean) => {
    audio().unlock();
    run.begin(asGuest);
    st.current = { start: performance.now(), nextSpawn: performance.now() + 600, score: 0, combo: 0, id: 0, holes: Array(9).fill(null), over: false };
    setHoles(Array(9).fill(null)); setScore(0); setCombo(0); setLeft(ROUND_MS); setPops([]); setRes(null);
    setPhase("play");
    audio().sfx("start");
  };

  const popText = (x: number, y: number, text: string, cls: string) => {
    const id = Math.random();
    setPops((p) => [...p.slice(-8), { id, x, y, text, cls }]);
    setTimeout(() => setPops((p) => p.filter((q) => q.id !== id)), 750);
  };

  const whack = (i: number, e: React.PointerEvent) => {
    if (phase !== "play") return;
    const rect = board.current?.getBoundingClientRect();
    const x = e.clientX - (rect?.left ?? 0), y = e.clientY - (rect?.top ?? 0);
    setSwing({ x, y, k: Math.random() });
    const s = st.current, h = s.holes[i];
    if (!h || h.hit) { s.combo = 0; setCombo(0); audio().sfx("whiff"); return; }
    h.hit = true; h.until = performance.now() + 220;
    if (h.kind === "trap") {
      s.score = Math.max(0, s.score - 30); s.combo = 0;
      audio().sfx("snap"); popText(x, y, "−30", "bad");
      setShake(true); setTimeout(() => setShake(false), 300);
    } else {
      s.combo++;
      const m = 1 + Math.min(3, Math.floor(s.combo / 5));
      const pts = (h.kind === "gold" ? 50 : 10) * m;
      s.score += pts;
      audio().sfx(h.kind === "gold" ? "golden" : "bonk");
      popText(x, y, `+${pts}`, h.kind === "gold" ? "gold" : "good");
    }
    setScore(s.score); setCombo(s.combo); setHoles([...s.holes]);
  };

  const secs = Math.ceil(left / 1000);
  return (
    <MiniShell theme="hammer">
      {phase === "menu" && (
        <MiniMenu game="hammer" poster="/games/slot-2.webp" title="Hammer the Squeaks"
          how={["Bonk the mice as they pop up", "Golden mice are worth 5x", "Don't hit the mousetraps!", "Every 5 hits in a row raises your multiplier"]}
          onPlay={() => run.play(startRound)} loginHint={!run.authed} onLogin={run.login} />
      )}
      {phase !== "menu" && (
        <div className={`hm${shake ? " shake" : ""}`}>
          <div className="hm-hud">
            <div><small>Score</small><b>{fmt(score)}</b></div>
            <div className={`hm-mult m${mult}`}><small>Combo</small><b>x{mult}</b></div>
            <div><small>Time</small><b>{secs}s</b></div>
          </div>
          <div className="hm-timer"><i style={{ width: `${(left / ROUND_MS) * 100}%` }} className={secs <= 10 ? "low" : ""} /></div>
          <div className="hm-board" ref={board}>
            {holes.map((h, i) => (
              <button key={i} className="hm-hole" onPointerDown={(e) => whack(i, e)} aria-label={h ? (h.kind === "trap" ? "Mousetrap" : "Mouse") : "Empty hole"}>
                <span className="hm-dirt" />
                {h && (
                  <span key={h.id} className={`hm-mouse ${h.kind}${h.hit ? " hit" : ""}`}>
                    {h.kind === "trap" ? <Trap /> : <img src={h.img} alt="" draggable={false} />}
                    {h.hit && h.kind !== "trap" && <span className="stars">✦ ✦ ✦</span>}
                  </span>
                )}
                <span className="hm-front" />
              </button>
            ))}
            {pops.map((p) => <span key={p.id} className={`hm-pop ${p.cls}`} style={{ left: p.x, top: p.y }}>{p.text}</span>)}
            {swing && <span key={swing.k} className="hm-hammer" style={{ left: swing.x, top: swing.y }}><Hammer /></span>}
          </div>
        </div>
      )}
      {phase === "over" && res && <MiniResult r={res} unit="Score" onAgain={() => run.play(startRound)} onLogin={run.login} />}
    </MiniShell>
  );
}
