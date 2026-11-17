"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import { Cheese, fmt, GameNav, PageHead, Price, Shell } from "@/components/ui";
import { SnowCap } from "@/components/winter";
import {
  MINE_HOURS, MINE_MAX_LEVEL, REF_BONUS, TESTING, mineCollect, mineProgress, mineRate, mineSkip, mineStart,
  mineUpgrade, mineUpgradeCost, mineYield, toast, useGame,
} from "@/lib/store";

const CREW = ["chef", "racer", "safari", "jazz", "ninja"];
const clock = (ms: number) => {
  const s = Math.ceil(ms / 1000);
  return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, "0")).join(":");
};

export default function Mine() {
  const g = useGame();
  const [now, setNow] = useState(0);
  useEffect(() => { setNow(Date.now()); const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const p = mineProgress(g, now || undefined);
  const lvl = g.mine.level;
  const cost = mineUpgradeCost(lvl);
  const link = typeof window === "undefined" || !g.handle ? "" : `${window.location.origin}/?ref=${g.handle}`;
  const step = !p.active ? 1 : p.done ? 3 : 2;

  const state = step === 1
    ? { title: "Your crew is ready", say: `Start a ${MINE_HOURS}-hour shift. You can close the app; the mine keeps working.` }
    : step === 2
      ? { title: "Mining in progress", say: "Come back when the timer hits zero to collect your Cheese." }
      : { title: "Cheese is ready!", say: "Collect it, then start the next shift right away." };

  return (
    <Shell theme="game">
      <PageHead eyebrow="Cheese Mine" title={<>Mine Cheese while <span className="yel">you sleep.</span></>} img="chef">
        Start a shift, come back in {MINE_HOURS} hours, collect, repeat. Upgrade your crew to dig more each time.
      </PageHead>
      <section className="wrap" style={{ paddingBottom: 0 }}><GameNav /></section>

      <section className="wrap">
        <div className="steps3" aria-label="How it works">
          {["Start a shift", `Wait ${MINE_HOURS}h`, "Collect"].map((t, i) => (
            <div key={t} className={step === i + 1 ? "on" : step > i + 1 ? "done" : ""}><i>{step > i + 1 ? "✓" : i + 1}</i>{t}</div>
          ))}
        </div>

        <div className="two">
          <div className="mine card capped" style={{ border: 0 }}>
            <SnowCap />
            <span className="pill">Level {lvl} crew</span>
            <h2>{state.title}</h2>
            <p className="say">{state.say}</p>

            <div className={`ring${step === 2 ? " going" : ""}${step === 3 ? " ready" : ""}`} style={{ ["--p" as string]: p.pct * 100 }}>
              <div>
                <span className="pile">{step === 3 ? "🧀" : step === 2 ? "⛏️" : "😴"}</span>
                <div className="t">{step === 2 ? clock(p.left) : step === 3 ? fmt(mineYield(lvl)) : `${MINE_HOURS}:00:00`}</div>
                <div className="muted small" style={{ fontWeight: 700 }}>
                  {step === 2 ? <><Cheese s={13} /> {fmt(p.mined)} mined so far</> : step === 3 ? "Cheese waiting" : "per shift"}
                </div>
              </div>
            </div>

            <div className="crew">
              {CREW.map((w, i) => <div key={w} className={i >= lvl ? "locked" : ""} title={i < lvl ? "Worker" : `Unlocks at level ${i + 1}`}><img src={`/mice/${w}.webp`} alt="" /></div>)}
            </div>

            <div style={{ marginTop: 22, display: "grid", gap: 10 }}>
              {step === 1 && <button className="btn btn-play btn-big btn-block" onClick={() => { mineStart(); toast(`Shift started. Back in ${MINE_HOURS} hours!`); }}>⛏️ Start mining</button>}
              {step === 2 && <button className="btn btn-ghost btn-big btn-block" disabled>Mining… {clock(p.left)}</button>}
              {step === 3 && <button className="btn btn-play btn-big btn-block" onClick={() => { const n = mineCollect(); if (n) toast(`+${fmt(n)} Cheese collected`); }}>🧀 Collect {fmt(mineYield(lvl))} Cheese</button>}
              {TESTING && step === 2 && <button className="btn btn-ghost btn-sm" onClick={mineSkip}>Testing only: finish the shift now</button>}
            </div>

            <div className="chips">
              <span><b>{mineRate(lvl)}</b> Cheese / hour</span>
              <span><b>{fmt(mineYield(lvl))}</b> per shift</span>
              <span><b>{fmt(g.mine.total)}</b> mined all-time</span>
            </div>
          </div>

          <div style={{ display: "grid", gap: 18 }}>
            <div className="card">
              <div className="row"><h3 style={{ fontSize: 22 }}>Upgrade your crew</h3><span className="pill gray">Level {lvl} / {MINE_MAX_LEVEL}</span></div>
              <div className="lvl" aria-hidden>{Array.from({ length: MINE_MAX_LEVEL }, (_, i) => <i key={i} className={i < lvl ? "on" : ""} />)}</div>
              <p className="muted">Each level adds a worker and <b style={{ color: "var(--text)" }}>+{fmt(mineYield(1))} Cheese</b> per shift. Upgrade between shifts.</p>
              <div className="row" style={{ marginTop: 16 }}>
                {lvl < MINE_MAX_LEVEL ? <Price price={100 * lvl * lvl} /> : <span className="muted">Max level reached</span>}
                <button className="btn btn-play btn-sm" disabled={lvl >= MINE_MAX_LEVEL || p.active || g.cheese < cost} onClick={() => mineUpgrade() && toast(`Crew upgraded to level ${lvl + 1}!`)}>
                  {p.active ? "Finish the shift first" : "Upgrade"}
                </button>
              </div>
            </div>

            <div className="card">
              <h3 style={{ fontSize: 22 }}>Invite a friend</h3>
              <p className="muted" style={{ marginTop: 8 }}>
                You both get <b style={{ color: "var(--text)" }}>{REF_BONUS} Cheese</b> once when they finish their first run. One level only, no pyramid.
              </p>
              {link ? (
                <div className="copy">
                  <input readOnly value={link} onFocus={(e) => e.target.select()} aria-label="Your invite link" />
                  <button className="btn btn-play btn-sm" onClick={() => navigator.clipboard?.writeText(link).then(() => toast("Invite link copied"))}>Copy</button>
                </div>
              ) : <a href="/profile" className="btn btn-ghost btn-sm" style={{ marginTop: 14 }}>Set a handle to get your link</a>}
              {g.ref && <p className="small" style={{ marginTop: 12, fontWeight: 700 }}>Invited by <span className="yel">@{g.ref}</span></p>}
            </div>

            <div className="card">
              <h3 style={{ fontSize: 22, marginBottom: 14 }}>How the mine works</h3>
              <div className="how">
                <div><span className="n">1</span><div><b>One shift at a time</b><span className="muted small">A shift lasts {MINE_HOURS} hours and fills up while you are away.</span></div></div>
                <div><span className="n">2</span><div><b>It waits for you</b><span className="muted small">When a shift ends, your Cheese stays safe until you collect it.</span></div></div>
                <div><span className="n">3</span><div><b>Cheese, not crypto</b><span className="muted small">Cheese is an in-game currency for the shop. It has no cash value.</span></div></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Shell>
  );
}
