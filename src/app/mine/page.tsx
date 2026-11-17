"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import { Cheese, fmt, PageHead, Price, Shell } from "@/components/ui";
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

  return (
    <Shell>
      <PageHead eyebrow="Mine" title={<>The Cheese <span className="yel">Mine</span></>} img="chef">
        Send your crew down for {MINE_HOURS} hours. When the session ends, collect the Cheese and start the next one.
      </PageHead>
      <section className="wrap two">
        <div className="mine">
          <div className="row">
            <span className="pill">Level {lvl}</span>
            <span className="muted" style={{ fontWeight: 800 }}>{mineRate(lvl)} <Cheese /> / hour · {fmt(mineYield(lvl))} per session</span>
          </div>
          <div className="ring" style={{ ["--p" as string]: p.pct * 100 }}>
            <div>
              {p.active ? (
                <>
                  <div className="t">{p.done ? "Ready" : clock(p.left)}</div>
                  <div className="yel" style={{ fontWeight: 800 }}><Cheese /> {fmt(p.mined)} mined</div>
                </>
              ) : (
                <><div className="t">Idle</div><div className="muted" style={{ fontWeight: 800 }}>Crew is waiting</div></>
              )}
            </div>
          </div>
          <div className="crew">
            {CREW.map((w, i) => <div key={w} className={i >= lvl ? "locked" : ""}><img src={`/mice/${w}.webp`} alt="" /></div>)}
          </div>
          <div style={{ marginTop: 20, display: "grid", gap: 10 }}>
            {!p.active && <button className="btn btn-play btn-big btn-block" onClick={() => { mineStart(); toast("Mining started. Back in 24 hours."); }}>Start mining</button>}
            {p.active && <button className="btn btn-play btn-big btn-block" disabled={!p.done} onClick={() => { const n = mineCollect(); if (n) toast(`Collected ${fmt(n)} Cheese`); }}>{p.done ? `Collect ${fmt(mineYield(lvl))} Cheese` : "Mining…"}</button>}
            {TESTING && p.active && !p.done && <button className="btn btn-ghost btn-sm" onClick={mineSkip}>Testing only: finish session now</button>}
          </div>
        </div>

        <div style={{ display: "grid", gap: 18 }}>
          <div className="card">
            <div className="row"><span className="eyebrow">Upgrade crew</span><span className="pill gray">{lvl} / {MINE_MAX_LEVEL}</span></div>
            <p className="muted" style={{ margin: "12px 0 16px" }}>Each level adds a worker and {fmt(mineYield(1))} Cheese per session. Upgrades apply between sessions.</p>
            <div className="row">
              {lvl < MINE_MAX_LEVEL ? <Price price={100 * lvl * lvl} /> : <span className="muted">Max level</span>}
              <button className="btn btn-play btn-sm" disabled={lvl >= MINE_MAX_LEVEL || p.active || g.cheese < cost} onClick={() => mineUpgrade() && toast(`Mine upgraded to level ${lvl + 1}`)}>
                {p.active ? "Wait for session" : "Upgrade"}
              </button>
            </div>
          </div>
          <div className="card">
            <span className="eyebrow">Invite a friend</span>
            <p className="muted" style={{ margin: "12px 0 0" }}>
              You and your friend each get a one-time {REF_BONUS} Cheese when they finish their first run. One level only, and no bonus for how many people they invite.
            </p>
            {link ? (
              <div className="copy">
                <input readOnly value={link} onFocus={(e) => e.target.select()} />
                <button className="btn btn-play btn-sm" onClick={() => navigator.clipboard?.writeText(link).then(() => toast("Invite link copied"))}>Copy</button>
              </div>
            ) : <a href="/profile" className="btn btn-ghost btn-sm" style={{ marginTop: 14 }}>Set a handle to get your link</a>}
            {g.ref && <p className="small" style={{ marginTop: 12, fontWeight: 800 }}>Invited by <span className="yel">@{g.ref}</span></p>}
            <p className="muted small" style={{ marginTop: 10 }}>Bonuses are credited once accounts go live. Guest test data stays on this device.</p>
          </div>
          <div className="card">
            <span className="eyebrow">Lifetime</span>
            <div className="kv" style={{ marginTop: 14 }}><span>Total mined</span><span className="yel"><Cheese /> {fmt(g.mine.total)}</span><span>Sessions collected today</span><span>{g.day.mined}</span></div>
          </div>
        </div>
      </section>
    </Shell>
  );
}
