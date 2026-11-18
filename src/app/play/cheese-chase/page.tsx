"use client";
/* Cheese Chase: a standalone, full-screen game. No site nav or footer here. */
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Cheese, fmt } from "@/components/ui";
import { GameIcon } from "@/components/game-icons";
import {
  canClaimDaily, dailyReward, finishRun, getGame, item, markDaily, missionProgress, MISSIONS,
  spendBoosts, toast, useGame, useToast,
} from "@/lib/store";
import type { Action, PowerKind, Runner3D } from "@/game/runner3d";
import { audio } from "@/game/audio";
import { useAccount } from "@/components/auth";
import { useAccountState } from "@/lib/store";
import { cheeseMsg, useCheese, type CreditRes } from "@/lib/cheese-client";
import { MysteryReveal } from "@/components/mystery";
import { CheeseLoader } from "@/components/cheese-loader";
import { MYSTERY } from "@/lib/content";
import { addPass, noteBox } from "@/lib/store";

type Res = { score: number; cheese: number | null; points: number; best: boolean; practice?: boolean; capped?: boolean; note?: string; mystery?: boolean };
type Phase = "menu" | "run" | "paused" | "over";
const KEYS: Record<string, Action> = { ArrowLeft: "l", a: "l", ArrowRight: "r", d: "r", ArrowUp: "j", w: "j", " ": "j", ArrowDown: "s", s: "s" };
const BOOSTS = [
  { id: "boost_magnet", n: "Magnet", e: "magnet" as const, d: "Pulls Cheese from every lane" },
  { id: "boost_double", n: "Double", e: "star" as const, d: "Double Cheese this run" },
  { id: "boost_head", n: "Head start", e: "rocket" as const, d: "Start at 500 score" },
];

export default function CheeseChase() {
  const g = useGame();
  const t = useToast();
  const acct = useAccount();
  const saved = useAccountState();
  const ticketRef = useRef<string | null>(null);
  const lastTicket = useRef<string | null>(null); // kept after the run for the mystery box code
  const [boxDone, setBoxDone] = useState(false);
  const cheese = useCheese();
  const cheeseRef = useRef(cheese);
  cheeseRef.current = cheese;
  const practice = useRef(false);
  const acctRef = useRef(acct);
  acctRef.current = acct;
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
  const [powers, setPowers] = useState<{ k: PowerKind; left: number; total: number }[]>([]);
  type Fly = { id: number; x: number; y: number; tx: number; ty: number };
  const [flyers, setFlyers] = useState<Fly[]>([]);
  const flyId = useRef(0);
  const pillRef = useRef<HTMLSpanElement>(null);
  const bump = () => { const el = pillRef.current; if (!el) return; el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump"); };

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
        onEnd: (s, c) => {
          const mystery = !!e?.gotMystery;
          if (practice.current) { setRes({ score: s, cheese: c, points: 0, best: false, practice: true, mystery }); setPhase("over"); return; }
          // the server checks the run and decides the Cheese; CardicX credits it once (ref run_<id>)
          const tk = ticketRef.current; ticketRef.current = null;
          setRes({ score: s, cheese: null, points: 0, best: s > getGame().best, mystery });
          setPhase("over");
          const done = (credited: number, capped = false, note?: string) => { const l = finishRun(s, credited); setRes({ score: s, cheese: credited, points: l.points, best: l.best, capped, note, mystery }); };
          if (!tk) { done(0, false, "This run could not be verified, so no Cheese this time."); return; }
          cheeseRef.current.call<CreditRes>("/run/finish", { ticket: tk, score: s, cheese: c })
            .then((r) => done(r.credited, r.capped))
            .catch((e) => done(0, false, cheeseMsg(e)));
        },
        // a collected wedge flies from where it was picked up into the HUD counter
        onEvent: (ev) => {
          audio().sfx(ev);
          if (ev === "mystery") { noteBox(); toast("Mystery box! It opens when your run ends"); }
        },
        onPowers: (p) => setPowers(p),
        onPickup: (x, y) => {
          audio().sfx("pickup");
          const st = stage.current?.getBoundingClientRect(), pr = pillRef.current?.getBoundingClientRect();
          const tx = st && pr ? pr.left - st.left + 22 - x : 0, ty = st && pr ? pr.top - st.top + pr.height / 2 - y : -300;
          setFlyers((f) => [...f.slice(-10), { id: ++flyId.current, x, y, tx, ty }]);
        },
      });
      eng.current = e;
      // equipped shop skin, if it has a 3D model; otherwise the default mouse
      const skinUrl = item(getGame().equip.Skins)?.model;
      const url = skinUrl || undefined; // a missing file falls back to the default mouse
      const [model, props, decor, boosts, chaser, city] = await Promise.all([m.preloadMouse((p) => !dead && setLoad(Math.min(0.99, p)), url), m.preloadProps(), m.preloadDecor(), m.preloadBoosts(), m.preloadChaser(), m.preloadCity()]);
      if (dead) return;
      e.setProps(props);
      e.setDecor(decor);
      e.setBoosts(boosts);
      e.setChaser(chaser);
      e.setCity(city);
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

  const [snd, setSnd] = useState({ music: true, sfx: true });
  useEffect(() => { const a = audio(); setSnd({ music: a.musicOn, sfx: a.sfxOn }); }, []);
  // browsers only allow audio after a tap: unlock and start the music on the first one
  useEffect(() => {
    const go = () => { const a = audio(); a.unlock(); a.startMusic(); };
    window.addEventListener("pointerdown", go, { once: true });
    window.addEventListener("keydown", go, { once: true });
    return () => { window.removeEventListener("pointerdown", go); window.removeEventListener("keydown", go); audio().stopMusic(); };
  }, []);
  const toggle2 = (k: "music" | "sfx") => {
    const a = audio(); a.unlock();
    if (k === "music") a.setMusic(!a.musicOn); else a.setSfx(!a.sfxOn);
    setSnd({ music: a.musicOn, sfx: a.sfxOn });
    a.sfx("click");
  };

  // guests can practise; earning needs an account (when login is switched on)
  const play = () => (acct.enabled && !acct.authed ? acct.gate("play", () => start(true)) : start(false));
  const start = (asGuest = false) => {
    practice.current = asGuest;
    setPowers([]);
    audio().unlock();
    ticketRef.current = null; lastTicket.current = null; setBoxDone(false);
    if (!asGuest && acct.authed) cheese.call<{ ticket: string }>("/run/start", {}).then((r) => { ticketRef.current = r.ticket; lastTicket.current = r.ticket; }).catch(() => {});
    setFlyers([]);
    const st = getGame();
    const used = spendBoosts(pick);
    setActive(pick.filter((id) => (st.boosts[id] ?? 0) > 0));
    setPick([]);
    if (scoreEl.current) scoreEl.current.textContent = used.head ? "500" : "0";
    if (cheeseEl.current) cheeseEl.current.textContent = "0";
    if (eng.current) eng.current.paused = false;
    // the CardicX mystery box: early for a player's first few boxes, then a distance milestone
    const mysteryAt = (st.boxes ?? 0) < MYSTERY.previewBoxes ? MYSTERY.previewAt : MYSTERY.milestoneAt;
    eng.current?.start({ trail: item(st.equip.Trails)?.color ?? "", ...used, mysteryAt });
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
              <Link href="/shop" className="gm-pill"><Cheese s={18} /><b>{saved ? fmt(saved.cheese) : "—"}</b><span className="plus">+</span></Link>
              <span className="gm-pill pts"><span className="star">★</span><b>{fmt(saved?.points ?? g.points)}</b></span>
              <button className={`gm-round sm${snd.music ? "" : " off"}`} onClick={() => toggle2("music")} aria-label={snd.music ? "Music off" : "Music on"} aria-pressed={snd.music} title="Music"><GameIcon n="music" s={20} /></button>
              <button className={`gm-round sm${snd.sfx ? "" : " off"}`} onClick={() => toggle2("sfx")} aria-label={snd.sfx ? "Sound effects off" : "Sound effects on"} aria-pressed={snd.sfx} title="Sound effects"><GameIcon n="sound" s={20} /></button>
              <Link href="/play" className="gm-round sm" aria-label="Back to the arcade"><GameIcon n="close" s={18} /></Link>
            </div>

            <div className="gm-cols">
              <div className="gm-side">
                <div className="gm-card"><span className="gm-ic"><GameIcon n="trophy" /></span><div><small>High score</small><b>{fmt(g.best)}</b></div></div>
                <div className="gm-card"><span className="gm-ic"><GameIcon n="runner" /></span><div><small>Runs today</small><b>{g.day.runs}</b></div></div>
                <div className="gm-icons">
                  <Link href="/rewards" className="gm-icon" aria-label="Missions"><GameIcon n="missions" s={28} />{claimable > 0 && <i className="gm-badge">{claimable}</i>}</Link>
                  <Link href="/leaderboard" className="gm-icon" aria-label="Leaderboard"><GameIcon n="board" s={28} /></Link>
                  <Link href="/shop" className="gm-icon" aria-label="Shop"><GameIcon n="shop" s={28} /></Link>
                </div>
              </div>
              <div className="gm-side right">
                <button className={`gm-gift${gift ? " on" : ""}`} disabled={!gift} onClick={() => {
                  if (!acct.authed) return acct.gate("claim");
                  cheese.call<CreditRes>("/daily", {}).then((r) => {
                    markDaily();
                    if (r.duplicate) toast("Already claimed today");
                    else if (r.credited === 0 && r.capped) toast("You reached today's Cheese limit from Squeaks");
                    else { audio().unlock(); audio().sfx("gift"); toast(`Daily gift: +${r.credited} Cheese`); }
                  }).catch((e) => toast(cheeseMsg(e)));
                }}>
                  <span className="gm-ic big"><GameIcon n="gift" s={32} /></span>
                  <span><b>{gift ? "FREE" : "Claimed"}</b><small>{gift ? `${dailyReward(0)} Cheese` : "Back tomorrow"}</small></span>
                  {gift && <i className="gm-badge">1</i>}
                </button>
                <div className="gm-boosts">
                  <small>Boosters</small>
                  {BOOSTS.map((b) => {
                    const n = g.boosts[b.id] ?? 0, on = pick.includes(b.id);
                    return (
                      <button key={b.id} className={`gm-boost${on ? " on" : ""}`} disabled={n === 0} onClick={() => toggle(b.id)} title={b.d} aria-pressed={on}>
                        <span><GameIcon n={b.e} s={22} /></span><em>{b.n}</em><i>{n}</i>
                      </button>
                    );
                  })}
                  <Link href="/shop" className="gm-more">Get boosters →</Link>
                </div>
              </div>
            </div>

            <div className="gm-bottom">
              <Link href="/shop" className="gm-skin">Character: <b>{item(g.equip.Skins)?.name}</b> · Change</Link>
              <button className="gm-play" onClick={play}>PLAY</button>
              {acct.enabled && !acct.authed && <button className="gm-skin" onClick={acct.login}>Log in to earn Cheese →</button>}
              <p>Swipe left or right to change lanes, up to jump, down to slide</p>
            </div>
          </div>
        )}
        {phase === "menu" && !ready && <CheeseLoader p={load} label="Loading Cheese City…" tips={TIPS} />}

        {/* ---------- RUN HUD ---------- */}
        {(phase === "run" || phase === "paused") && (
          <div className="gm-hud">
            <span className="hud-pill"><span ref={scoreEl}>0</span></span>
            <div className="gm-hud-r">
              {active.map((id) => <span key={id} className="hud-boost">{(() => { const e = BOOSTS.find((b) => b.id === id)?.e; return e ? <GameIcon n={e} s={20} /> : null; })()}</span>)}
              <span className="hud-pill" ref={pillRef}><Cheese s={18} /> <span ref={cheeseEl}>0</span></span>
              <button className="gm-round" onPointerDown={(e) => e.stopPropagation()} onClick={pause} aria-label="Pause"><GameIcon n="pause" s={18} /></button>
            </div>
          </div>
        )}
        {flyers.map((f) => (
          <span key={f.id} className="flyer" style={{ left: f.x, top: f.y, ["--tx" as string]: `${f.tx}px`, ["--ty" as string]: `${f.ty}px` }}
            onAnimationEnd={() => { setFlyers((fs) => fs.filter((x) => x.id !== f.id)); bump(); }}><Cheese s={24} /></span>
        ))}
        {(phase === "run" || phase === "paused") && powers.length > 0 && (
          <div className="pw-bar" aria-label="Active boosters">
            {powers.map((p) => (
              <span key={p.k} className={`pw pw-${p.k}`} style={{ ["--p" as string]: `${(p.left / p.total) * 100}%` }}>
                <GameIcon n={p.k === "magnet" ? "magnet" : p.k === "double" ? "star" : "hover"} s={26} /><i>{Math.ceil(p.left)}</i>
              </span>
            ))}
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

        {phase === "over" && res?.mystery && !boxDone && (
          <MysteryReveal
            authed={(acct.authed && !res.practice)}
            onLogin={acct.login}
            onDone={() => setBoxDone(true)}
            getCode={async () => {
              const tk = lastTicket.current;
              if (!tk) return null;
              const r = await cheese.call<{ code: string }>("/mystery", { ticket: tk });
              addPass(r.code);
              return r.code;
            }}
          />
        )}
        {phase === "over" && res && (!res.mystery || boxDone) && (
          <div className="gm-sheet" onPointerDown={(e) => e.stopPropagation()}>
            <div className="gm-panel">
              {res.best && <span className="gm-ribbon">New high score!</span>}
              <small className="muted">Score</small>
              <h2 className="gm-score">{fmt(res.score)}</h2>
              {res.practice && <p className="guestnote">This was a practice run, so nothing was saved. Log in to keep your Cheese next time.</p>}
              {res.practice && <button className="btn btn-sky btn-block" onClick={acct.login}>Log in to earn</button>}
              {res.capped && <p className="guestnote">You reached today&apos;s Cheese limit from Squeaks.</p>}
              {res.note && <p className="guestnote">{res.note}</p>}
              <div className="gm-earn">
                <div><Cheese s={22} /><b>{res.cheese === null ? "…" : `+${fmt(res.cheese)}`}</b><small>{res.practice ? "Not saved" : "Cheese"}</small></div>
                <div><span className="star">★</span><b>+{res.points}</b><small>Points</small></div>
              </div>
              <button className="gm-play sm" onClick={() => (res.practice ? play() : start(false))}>Play again</button>
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
  "Swipe up to jump over the striped barriers.",
  "Swipe down to slide under the low gates.",
  "A train fills its whole lane. Switch lanes early!",
  "Cheese floats over barriers. Jump to grab it.",
  "Grab the hoverboard: it saves you from one hit.",
];
