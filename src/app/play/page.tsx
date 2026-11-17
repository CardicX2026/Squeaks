"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Cheese, fmt, PageHead, Shell } from "@/components/ui";
import { finishRun, getGame, item, takeBoosts, useGame } from "@/lib/store";
import type { Action, Runner3D } from "@/game/runner3d";

type Res = { score: number; cheese: number; points: number; best: boolean };
const KEYS: Record<string, Action> = { ArrowLeft: "l", a: "l", ArrowRight: "r", d: "r", ArrowUp: "j", w: "j", " ": "j", ArrowDown: "s", s: "s" };

export default function Play() {
  const g = useGame();
  const stage = useRef<HTMLDivElement>(null);
  const eng = useRef<Runner3D | null>(null);
  const scoreEl = useRef<HTMLSpanElement>(null);
  const cheeseEl = useRef<HTMLSpanElement>(null);
  const down = useRef<{ x: number; y: number } | null>(null);
  const [phase, setPhase] = useState<"idle" | "run" | "over">("idle");
  const [res, setRes] = useState<Res | null>(null);
  const [load, setLoad] = useState(0); // 0..1 while the 3D mouse downloads

  // create the 3D engine once; it renders the idle scene behind the start screen
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

  useEffect(() => {
    if (phase !== "run") return;
    const key = (e: KeyboardEvent) => { const a = KEYS[e.key]; if (a) { e.preventDefault(); eng.current?.act(a); } };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [phase]);

  const full = phase !== "idle";
  useEffect(() => {
    document.body.style.overflow = full ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [full]);

  const begin = () => {
    const st = getGame();
    const b = takeBoosts();
    if (scoreEl.current) scoreEl.current.textContent = "0";
    if (cheeseEl.current) cheeseEl.current.textContent = "0";
    eng.current?.start({ trail: item(st.equip.Trails)?.color ?? "", ...b });
    setPhase("run");
  };
  const exit = () => { eng.current?.stop(); setPhase("idle"); };

  // Touch: a swipe fires as soon as the finger moves 14px; a tap picks a side.
  const pDown = (e: React.PointerEvent) => {
    if (phase !== "run") return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    down.current = { x: e.clientX, y: e.clientY };
  };
  const pMove = (e: React.PointerEvent) => {
    const d = down.current;
    if (!d || phase !== "run") return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (Math.abs(dx) < 14 && Math.abs(dy) < 14) return;
    if (Math.abs(dx) > Math.abs(dy)) eng.current?.act(dx < 0 ? "l" : "r");
    else eng.current?.act(dy < 0 ? "j" : "s");
    down.current = null;
  };
  const pUp = (e: React.PointerEvent) => {
    const d = down.current; down.current = null;
    if (!d || phase !== "run") return;
    const r = e.currentTarget.getBoundingClientRect();
    eng.current?.act(e.clientX - r.left < r.width / 2 ? "l" : "r");
  };
  const boosts = Object.entries(g.boosts).filter(([, n]) => n > 0);

  return (
    <Shell>
      <div className="playhead"><PageHead eyebrow="Play" title={<>Cheese <span className="yel">Chase</span></>}>
        Skate the neon rails of Cheese City. Switch lanes, jump the barriers, slide under the lasers and dodge the cargo pods.
      </PageHead></div>
      <section className="wrap two">
        <div className={full ? "fullwrap" : undefined}>
          <div ref={stage} className={`stage${full ? " full" : ""}`} onPointerDown={pDown} onPointerMove={pMove} onPointerUp={pUp} onPointerCancel={() => { down.current = null; }}>
            {phase === "run" && (
              <div className="hud">
                <span className="hud-pill"><span ref={scoreEl}>0</span></span>
                <span className="hud-pill yel"><Cheese s={18} /> <span ref={cheeseEl}>0</span></span>
              </div>
            )}
            {phase === "run" && <div className="hint">Swipe ← → to switch · ↑ jump · ↓ slide</div>}
            {full && <button className="exit" aria-label="Exit game" onPointerDown={(e) => e.stopPropagation()} onClick={exit}>✕</button>}
            {phase === "idle" && (
              <div className="overlay soft">
                <h2>Ready?</h2>
                <p className="muted">Swipe or use arrow keys: left, right, jump, slide</p>
                <button className="btn btn-play btn-big" disabled={load < 1} onClick={begin}>
                  {load < 1 ? `Loading 3D… ${Math.round(load * 100)}%` : "▶ Start run"}
                </button>
              </div>
            )}
            {phase === "over" && res && (
              <div className="overlay">
                <span className="pill">{res.best ? "New best!" : "Run over"}</span>
                <h2>{fmt(res.score)}</h2>
                <p style={{ fontWeight: 800 }}><Cheese /> +{fmt(res.cheese)} Cheese · <span style={{ color: "var(--peach)" }}>+{res.points} pts</span></p>
                <button className="btn btn-play btn-big" onClick={begin}>▶ Run again</button>
                <Link href="/leaderboard" className="btn btn-ghost btn-sm">See leaderboard</Link>
              </div>
            )}
          </div>
        </div>
        <div style={{ display: "grid", gap: 18 }}>
          <div className="card">
            <span className="eyebrow">Your record</span>
            <div className="kv" style={{ marginTop: 14 }}>
              <span>Best score</span><span className="yel">{fmt(g.best)}</span>
              <span>Runs today</span><span>{g.day.runs}</span>
              <span>Points from runs today</span><span>{g.day.points} / 300</span>
              <span>Trail</span><span>{item(g.equip.Trails)?.name ?? "None"}</span>
            </div>
          </div>
          <div className="card">
            <span className="eyebrow">Boosts for next run</span>
            {boosts.length ? (
              <p style={{ marginTop: 12, fontWeight: 700 }}>{boosts.map(([id, n]) => `${item(id)?.glyph} ${item(id)?.name} ×${n}`).join("   ")}</p>
            ) : <p className="muted" style={{ marginTop: 12 }}>None loaded. One of each boost you own is used automatically per run.</p>}
            <Link href="/shop" className="btn btn-ghost btn-sm" style={{ marginTop: 14 }}>Open shop</Link>
          </div>
          <div className="card">
            <span className="eyebrow">Rules</span>
            <p className="muted" style={{ marginTop: 12 }}>A run pays up to 600 Cheese. Score earns 1 Squeaks point per 100, up to 300 points a day. In the live version each run is started and checked on the server.</p>
          </div>
        </div>
      </section>
    </Shell>
  );
}
