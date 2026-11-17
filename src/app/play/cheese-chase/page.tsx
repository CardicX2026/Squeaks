"use client";
/* Cheese Chase: a standalone, full-screen game. No site nav or footer here. */
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Cheese, fmt } from "@/components/ui";
import {
  canClaimDaily, claimDaily, dailyReward, finishRun, getGame, item, missionProgress, MISSIONS,
  spendBoosts, toast, useGame, useToast,
} from "@/lib/store";
import type { Action, Runner3D } from "@/game/runner3d";

type Res = { score: number; cheese: number; points: number; best: boolean };
type Phase = "menu" | "run" | "paused" | "over";
const KEYS: Record<string, Action> = { ArrowLeft: "l", a: "l", ArrowRight: "r", d: "r", ArrowUp: "j", w: "j", " ": "j", ArrowDown: "s", s: "s" };
const BOOSTS = [
  { id: "boost_magnet", n: "Magnet", e: "🧲", d: "Pulls Cheese from every lane" },
  { id: "boost_double", n: "Double", e: "✨", d: "Double Cheese this run" },
  { id: "boost_head", n: "Head start", e: "🚀", d: "Start at 500 score" },
];

export default function CheeseChase() {
  const g = useGame();
  const t = useToast();
  const stage = useRef<HTMLDivElement>(null);
  const eng = useRef<Runner3D | null>(null);
  const scoreEl = useRef<HTMLSpanElement>(null);
  const cheeseEl = useRef<HTMLSpanElement>(null);
  const down = useRef<{ x: number; y: number } | null>(null);
  const [phase, setPhase] = useState<Phase>("menu");
  const [res, setRes] = useState<Res | null>(null);
  const [load, setLoad] = useState(0);
  const [ready, setReady] = useState(false);
  const [pick, setPick] = useState<string[]>([]);
  const [active, setActive] = useState<string[]>([]);

  // full-screen page: lock page scroll
  useEffect(() => { document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = ""; }; }, []);

  // 3D engine: renders the idle city behind the menu, then the run
  useEffect(() => {
    let dead = false;
    let e: Runner3D | null = null;
    import("@/game/runner3d").then(async (m) => {
      if (dead || !stage.current) return;
      e = new m.Runner3D(stage.current, {
        onHud: (s, c) => {
          if (scoreEl.current) scoreEl.current.textContent = s.toLocaleString("en-US");
          if (cheeseEl.current) cheeseEl.current.textContent = String(c);
        },
        onEnd: (s, c) => { setRes({ score: s, ...finishRun(s, c) }); setPhase("over"); },
      });
      eng.current = e;
      const model = await m.preloadMouse((p) => !dead && setLoad(Math.min(0.99, p)));
      if (dead) return;
      e.setMouse(model);
      setLoad(1);
    });
    return () => { dead = true; e?.dispose(); eng.current = null; };
  }, []);
  useEffect(() => { if (load < 1) return; const tm = setTimeout(() => setReady(true), 650); return () => clearTimeout(tm); }, [load]);

  useEffect(() => {
    if (phase !== "run") return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "p") return pause();
      const a = KEYS[e.key];
      if (a) { e.preventDefault(); eng.current?.act(a); }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });

  const start = () => {
    const st = getGame();
    const used = spendBoosts(pick);
    setActive(pick.filter((id) => (st.boosts[id] ?? 0) > 0));
    setPick([]);
    if (scoreEl.current) scoreEl.current.textContent = used.head ? "500" : "0";
    if (cheeseEl.current) cheeseEl.current.textContent = "0";
    if (eng.current) eng.current.paused = false;
    eng.current?.start({ trail: item(st.equip.Trails)?.color ?? "", ...used });
    setPhase("run");
  };
  const pause = () => { if (eng.current) eng.current.paused = true; setPhase("paused"); };
  const resume = () => { if (eng.current) eng.current.paused = false; setPhase("run"); };
  const toMenu = () => { if (eng.current) { eng.current.paused = false; eng.current.stop(); } setPhase("menu"); };
  const toggle = (id: string) => setPick((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  // touch: swipe fires as soon as the finger moves 14px; a tap picks a side
  const pDown = (e: React.PointerEvent) => { if (phase !== "run") return; e.currentTarget.setPointerCapture?.(e.pointerId); down.current = { x: e.clientX, y: e.clientY }; };
  const pMove = (e: React.PointerEvent) => {
    const d = down.current;
    if (!d || phase !== "run") return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (Math.abs(dx) < 14 && Math.abs(dy) < 14) return;
    eng.current?.act(Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? "l" : "r") : dy < 0 ? "j" : "s");
    down.current = null;
  };
  const pUp = (e: React.PointerEvent) => {
    const d = down.current; down.current = null;
    if (!d || phase !== "run") return;
    const r = e.currentTarget.getBoundingClientRect();
    eng.current?.act(e.clientX - r.left < r.width / 2 ? "l" : "r");
  };

  const claimable = MISSIONS.filter((m) => !g.day.claimed.includes(m.id) && missionProgress(g, m.id) >= m.of).length;
  const gift = canClaimDaily(g);

  return (
    <div className="gameapp">
      <div ref={stage} className="gstage" onPointerDown={pDown} onPointerMove={pMove} onPointerUp={pUp} onPointerCancel={() => { down.current = null; }}>
        {/* ---------- MENU ---------- */}
        {phase === "menu" && ready && (
          <div className="gm">
            <div className="gm-top">
              <Link href="/shop" className="gm-pill"><Cheese s={18} /><b>{fmt(g.cheese)}</b><span className="plus">+</span></Link>
              <span className="gm-pill pts"><span className="star">★</span><b>{fmt(g.points)}</b></span>
              <Link href="/play" className="gm-round" aria-label="Back to the arcade">✕</Link>
            </div>

            <div className="gm-cols">
              <div className="gm-side">
                <div className="gm-card"><span className="gm-ic">🏆</span><div><small>High score</small><b>{fmt(g.best)}</b></div></div>
                <div className="gm-card"><span className="gm-ic">🏃</span><div><small>Runs today</small><b>{g.day.runs}</b></div></div>
                <div className="gm-icons">
                  <Link href="/rewards" className="gm-icon" aria-label="Missions">🎯{claimable > 0 && <i className="gm-badge">{claimable}</i>}</Link>
                  <Link href="/leaderboard" className="gm-icon" aria-label="Leaderboard">📊</Link>
                  <Link href="/shop" className="gm-icon" aria-label="Shop">🛍️</Link>
                </div>
              </div>
              <div className="gm-side right">
                <button className={`gm-gift${gift ? " on" : ""}`} disabled={!gift} onClick={() => { const n = claimDaily(); if (n) toast(`Daily gift: +${n} Cheese`); }}>
                  <span className="gm-ic big">🎁</span>
                  <span><b>{gift ? "FREE" : "Claimed"}</b><small>{gift ? `${dailyReward(Math.min(7, g.daily.streak + 1))} Cheese` : "Back tomorrow"}</small></span>
                  {gift && <i className="gm-badge">1</i>}
                </button>
                <div className="gm-boosts">
                  <small>Boosters</small>
                  {BOOSTS.map((b) => {
                    const n = g.boosts[b.id] ?? 0, on = pick.includes(b.id);
                    return (
                      <button key={b.id} className={`gm-boost${on ? " on" : ""}`} disabled={n === 0} onClick={() => toggle(b.id)} title={b.d} aria-pressed={on}>
                        <span>{b.e}</span><em>{b.n}</em><i>{n}</i>
                      </button>
                    );
                  })}
                  <Link href="/shop" className="gm-more">Get boosters →</Link>
                </div>
              </div>
            </div>

            <div className="gm-bottom">
              <button className="gm-play" onClick={start}>PLAY</button>
              <p>Swipe ← → to switch lanes · ↑ jump · ↓ slide</p>
            </div>
          </div>
        )}
        {phase === "menu" && !ready && <CheeseLoader p={load} />}

        {/* ---------- RUN HUD ---------- */}
        {(phase === "run" || phase === "paused") && (
          <div className="gm-hud">
            <span className="hud-pill"><span ref={scoreEl}>0</span></span>
            <div className="gm-hud-r">
              {active.map((id) => <span key={id} className="hud-boost">{BOOSTS.find((b) => b.id === id)?.e}</span>)}
              <span className="hud-pill"><Cheese s={18} /> <span ref={cheeseEl}>0</span></span>
              <button className="gm-round" onPointerDown={(e) => e.stopPropagation()} onClick={pause} aria-label="Pause">❚❚</button>
            </div>
          </div>
        )}
        {phase === "run" && <div className="hint">Swipe ← → · ↑ jump · ↓ slide</div>}

        {phase === "paused" && (
          <div className="gm-sheet" onPointerDown={(e) => e.stopPropagation()}>
            <div className="gm-panel">
              <h2>Paused</h2>
              <button className="gm-play sm" onClick={resume}>Resume</button>
              <button className="btn btn-ghost btn-block" onClick={toMenu}>Quit to menu</button>
            </div>
          </div>
        )}

        {phase === "over" && res && (
          <div className="gm-sheet" onPointerDown={(e) => e.stopPropagation()}>
            <div className="gm-panel">
              {res.best && <span className="gm-ribbon">New high score!</span>}
              <small className="muted">Score</small>
              <h2 className="gm-score">{fmt(res.score)}</h2>
              <div className="gm-earn">
                <div><Cheese s={22} /><b>+{fmt(res.cheese)}</b><small>Cheese</small></div>
                <div><span className="star">★</span><b>+{res.points}</b><small>Points</small></div>
              </div>
              <button className="gm-play sm" onClick={start}>Play again</button>
              <div className="gm-row">
                <button className="btn btn-ghost" onClick={toMenu}>Menu</button>
                <Link href="/leaderboard" className="btn btn-ghost">Leaderboard</Link>
              </div>
            </div>
          </div>
        )}
      </div>
      {t && <div className="toast" role="status">{t}</div>}
    </div>
  );
}

const TIPS = [
  "Swipe up to jump the striped barriers.",
  "Swipe down to slide under the laser gates.",
  "Cargo pods fill a lane. Switch lanes early!",
  "Cheese arcs over barriers. Jump to grab it.",
];

/** Cheese wedge that fills from the bottom as the game loads. */
function CheeseLoader({ p }: { p: number }) {
  const [tip, setTip] = useState(0);
  const [shown, setShown] = useState(0);
  useEffect(() => { const t = setInterval(() => setTip((i) => (i + 1) % TIPS.length), 2200); return () => clearInterval(t); }, []);
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
      <p className="tip">Loading Cheese City… {TIPS[tip]}</p>
    </div>
  );
}
