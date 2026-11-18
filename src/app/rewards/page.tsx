"use client";
import { Cheese, PageHead, Shell, GameNav } from "@/components/ui";
import { useAccount } from "@/components/auth";
import { canClaimDaily, claimDaily, claimMission, dailyReward, missionProgress, MISSIONS, toast, today, useGame } from "@/lib/store";

export default function Rewards() {
  const g = useGame();
  const acct = useAccount();
  const needLogin = () => (acct.enabled && !acct.authed ? (acct.gate("claim"), true) : false);
  const can = canClaimDaily(g);
  const yest = new Date(Date.now() - 86400_000).toISOString().slice(0, 10);
  const kept = g.daily.last === today() || g.daily.last === yest;
  const done = kept ? (g.daily.last === today() ? g.daily.streak : g.daily.streak % 7) : 0;

  return (
    <Shell theme="game">
      <PageHead eyebrow="Rewards" title={<>Show up, <span className="yel">get paid in Cheese</span></>} img="cozy">
        A daily reward that grows with your streak, and three missions that reset every day at 00:00 UTC.
      </PageHead>
      <section className="wrap" style={{ paddingBottom: 0 }}><GameNav /></section>
      <section className="wrap two">
        <div className="card">
          <div className="row"><h2 style={{ fontSize: 26 }}>Daily reward</h2><span className="pill">Streak {done} / 7</span></div>
          <div className="streak">
            {[1, 2, 3, 4, 5, 6, 7].map((d) => (
              <div key={d} className={`day${d <= done ? " done" : d === done + 1 && can ? " next" : ""}`}>
                <span>Day {d}<br />{dailyReward(d)}</span>
              </div>
            ))}
          </div>
          <button className="btn btn-play btn-block" disabled={!can} onClick={() => { if (needLogin()) return; const n = claimDaily(); if (n) toast(`Daily reward: +${n} Cheese, +5 points`); }}>
            {can ? `Claim ${dailyReward(done + 1)} Cheese + 5 points` : "Claimed. Come back tomorrow"}
          </button>
          <p className="muted small" style={{ marginTop: 12 }}>Miss a day and the streak restarts at day 1. After day 7 it loops.</p>
        </div>
        <div className="card">
          <div className="row" style={{ marginBottom: 16 }}><h2 style={{ fontSize: 26 }}>Missions</h2><span className="pill gray">Resets daily</span></div>
          {MISSIONS.map((m) => {
            const p = Math.min(m.of, missionProgress(g, m.id));
            const claimed = g.day.claimed.includes(m.id);
            return (
              <div className="mission" key={m.id}>
                <div className="grow">
                  <b>{m.title}</b>
                  <div className="bar" style={{ height: 8, margin: "8px 0 6px" }}><i style={{ width: `${(p / m.of) * 100}%` }} /></div>
                  <span className="muted small" style={{ fontWeight: 800 }}><Cheese s={13} /> +{m.cheese}{m.points ? ` · +${m.points} points` : ""} · {p}/{m.of}</span>
                </div>
                <button className="btn btn-play btn-sm" disabled={claimed || p < m.of} onClick={() => !needLogin() && claimMission(m.id) && toast(`Mission complete: +${m.cheese} Cheese`)}>{claimed ? "Done" : "Claim"}</button>
              </div>
            );
          })}
        </div>
      </section>
    </Shell>
  );
}
