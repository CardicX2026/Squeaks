"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useState } from "react";
import { CARDICX, Cheese, fmt, PageHead, Shell, GameNav } from "@/components/ui";
import { item, ITEMS, resetAll, setHandle, toast, useGame } from "@/lib/store";

export default function Profile() {
  const g = useGame();
  const [h, setH] = useState("");
  useEffect(() => setH(g.handle), [g.handle]);
  const owned = ITEMS.filter((i) => g.owned.includes(i.id));
  const skin = item(g.equip.Skins)?.img ?? "shades";

  return (
    <Shell theme="game">
      <PageHead eyebrow="Profile" title={g.handle ? <>@{g.handle}</> : <>Guest <span className="yel">mouse</span></>} img={skin}>
        You are playing as a guest. Progress is saved on this device until login goes live.
      </PageHead>
      <section className="wrap" style={{ paddingBottom: 0 }}><GameNav /></section>
      <section className="wrap two">
        <div style={{ display: "grid", gap: 18 }}>
          <div className="card">
            <span className="eyebrow">Balances</span>
            <div className="three" style={{ marginTop: 14, gap: 12 }}>
              <div><div className="muted small">Cheese</div><div className="big" style={{ fontSize: 30 }}><Cheese s={22} />{fmt(g.cheese)}</div></div>
              <div><div className="muted small">Squeaks points</div><div className="big" style={{ fontSize: 30, color: "var(--peach)" }}>{fmt(g.points)}</div></div>
              <div><div className="muted small">Best run</div><div className="big" style={{ fontSize: 30, color: "#fff" }}>{fmt(g.best)}</div></div>
            </div>
          </div>
          <div className="card">
            <span className="eyebrow">Handle</span>
            <form className="copy" onSubmit={(e) => { e.preventDefault(); const v = setHandle(h); toast(v.length >= 3 ? `Handle set to @${v}` : "Use 3 to 20 letters, numbers or _"); }}>
              <input className="inp" value={h} onChange={(e) => setH(e.target.value)} placeholder="your_handle" maxLength={20} />
              <button className="btn btn-play btn-sm">Save</button>
            </form>
            <p className="muted small" style={{ marginTop: 10 }}>Shown on the leaderboard and used in your invite link on the Mine page.</p>
          </div>
          <div className="card" style={{ borderColor: "rgba(59,120,255,.45)" }}>
            <span className="eyebrow" style={{ color: "var(--cx)" }}>CardicX account</span>
            <p className="muted" style={{ margin: "12px 0 16px" }}>Connect to save progress across devices and redeem your Squeaks rewards in the CardicX Rewards Center.</p>
            <div className="row" style={{ justifyContent: "flex-start" }}>
              <button className="btn btn-cx btn-sm" onClick={() => toast("Login is not switched on in this test build")}>Connect CardicX</button>
              <a className="cxl" href={CARDICX} target="_blank" rel="noreferrer">cardicx.com ↗</a>
            </div>
          </div>
        </div>
        <div style={{ display: "grid", gap: 18 }}>
          <div className="card">
            <div className="row"><span className="eyebrow">Owned items</span><Link href="/shop" className="yel small" style={{ fontWeight: 800 }}>Shop →</Link></div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
              {owned.map((i) => <span key={i.id} className={`pill${Object.values(g.equip).includes(i.id) ? "" : " gray"}`}>{i.glyph ?? ""} {i.name}</span>)}
              {Object.entries(g.boosts).filter(([, n]) => n > 0).map(([id, n]) => <span key={id} className="pill gray">{item(id)?.glyph} {item(id)?.name} ×{n}</span>)}
            </div>
          </div>
          <div className="card">
            <span className="eyebrow">Run history</span>
            {g.runs.length === 0 && <p className="muted" style={{ marginTop: 12 }}>No runs yet. <Link href="/play" className="yel">Play Cheese Chase</Link></p>}
            {g.runs.slice(0, 8).map((r) => (
              <div key={r.t} className="row" style={{ padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
                <span className="muted small">{new Date(r.t).toLocaleString()}</span>
                <span style={{ fontWeight: 800 }}>{fmt(r.score)} · <span className="yel"><Cheese s={13} /> {r.cheese}</span> · <span style={{ color: "var(--peach)" }}>{r.points} pts</span></span>
              </div>
            ))}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => { if (confirm("Reset all guest test data on this device?")) { resetAll(); toast("Test data reset"); } }}>Reset test data</button>
        </div>
      </section>
    </Shell>
  );
}
