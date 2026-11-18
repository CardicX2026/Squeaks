"use client";
import { Cheese, PageHead, Shell, GameNav } from "@/components/ui";
import { useAccount } from "@/components/auth";
import { canClaimDaily, dailyReward, markDaily, markMission, missionProgress, MISSIONS, toast, useGame } from "@/lib/store";
import { useState } from "react";
import { cheeseMsg, useCheese, type CreditRes } from "@/lib/cheese-client";

export default function Rewards() {
  const g = useGame();
  const acct = useAccount();
  const needLogin = () => (acct.enabled && !acct.authed ? (acct.gate("claim"), true) : false);
  const can = canClaimDaily(g);
  const cheese = useCheese();
  const [busy, setBusy] = useState("");
  // Cheese is paid by the server through CardicX; claims are idempotent per day
  const claimDaily = async () => {
    if (needLogin() || busy) return;
    setBusy("daily");
    try {
      const r = await cheese.call<CreditRes>("/daily", {});
      markDaily();
      toast(r.duplicate ? "Already claimed today" : r.credited === 0 && r.capped ? "You reached today\u2019s Cheese limit from Squeaks" : `Daily reward: +${r.credited} Cheese`);
    } catch (e) { toast(cheeseMsg(e)); } finally { setBusy(""); }
  };
  const claimMission = async (id: string) => {
    if (needLogin() || busy) return;
    setBusy(id);
    try {
      const r = await cheese.call<CreditRes>("/missions/claim", { missionId: id });
      markMission(id);
      toast(r.duplicate ? "Already claimed" : r.credited === 0 && r.capped ? "You reached today\u2019s Cheese limit from Squeaks" : `Mission complete: +${r.credited} Cheese`);
    } catch (e) { toast(cheeseMsg(e)); } finally { setBusy(""); }
  };

  return (
    <Shell theme="game">
      <PageHead eyebrow="Rewards" title={<>Show up, <span className="yel">get paid in Cheese</span></>} img="cozy">
        A daily Cheese gift and three missions that reset every day at 00:00 UTC. Missions are checked against your real activity.
      </PageHead>
      <section className="wrap" style={{ paddingBottom: 0 }}><GameNav /></section>
      <section className="wrap two">
        <div className="card">
          <div className="row"><h2 style={{ fontSize: 26 }}>Daily reward</h2><span className="pill">{can ? "Ready" : "Claimed today"}</span></div>
          <p className="muted" style={{ margin: "14px 0 18px" }}>Claim {dailyReward(0)} Cheese once a day. It goes straight to your Cheese balance, the same one you see on CardicX.</p>
          <button className="btn btn-play btn-block" disabled={!can || busy === "daily"} onClick={claimDaily}>
            {can ? `Claim ${dailyReward(0)} Cheese` : "Claimed. Come back tomorrow"}
          </button>
          <p className="muted small" style={{ marginTop: 12 }}>Resets every day at 00:00 UTC.</p>
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
                <button className="btn btn-play btn-sm" disabled={claimed || p < m.of || busy === m.id} onClick={() => claimMission(m.id)}>{claimed ? "Done" : "Claim"}</button>
              </div>
            );
          })}
        </div>
      </section>
    </Shell>
  );
}
