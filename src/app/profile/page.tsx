"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useState } from "react";
import { CARDICX, Cheese, fmt, PageHead, Shell, GameNav } from "@/components/ui";
import { item, ITEMS, setHandle, toast, useAccountState, useGame } from "@/lib/store";
import { useAccount } from "@/components/auth";

export default function Profile() {
  const g = useGame();
  const acct = useAccount();
  const saved = useAccountState();
  const [h, setH] = useState("");
  useEffect(() => setH(g.handle), [g.handle]);
  const owned = ITEMS.filter((i) => g.owned.includes(i.id));
  const skin = item(g.equip.Skins)?.img ?? "shades";

  return (
    <Shell theme="game">
      <PageHead eyebrow="Profile" title={g.handle ? <>@{g.handle}</> : acct.authed ? <>{acct.label}</> : <>Guest <span className="yel">mouse</span></>} img={skin}>
        {acct.authed
          ? "Signed in. Your Cheese lives on your CardicX account, the same balance on both sites."
          : "Log in with your CardicX account to earn Cheese, mine and save your progress."}
      </PageHead>
      <section className="wrap" style={{ paddingBottom: 0 }}><GameNav /></section>
      <section className="wrap two">
        <div style={{ display: "grid", gap: 18 }}>
          <div className="card">
            <span className="eyebrow">Balances</span>
            <div className="three" style={{ marginTop: 14, gap: 12 }}>
              <div><div className="muted small">Cheese</div><div className="big" style={{ fontSize: 30 }}><Cheese s={22} />{saved ? fmt(saved.cheese) : "—"}</div></div>
              <div><div className="muted small">Squeaks points</div><div className="big" style={{ fontSize: 30, color: "var(--peach)" }}>{fmt(g.points)}</div></div>
              <div><div className="muted small">Best run</div><div className="big" style={{ fontSize: 30, color: "#fff" }}>{fmt(g.best)}</div></div>
            </div>
          </div>
          <div className="card">
            <span className="eyebrow">Handle</span>
            <form className="copy" onSubmit={async (e) => {
              e.preventDefault();
              const v = h.toLowerCase();
              if (!/^[a-z0-9_]{3,20}$/.test(v)) return toast("Use 3 to 20 letters, numbers or _");
              if (!acct.authed) { setHandle(v); return toast(`Handle set to @${v}`); }
              // signed in: the name is saved on your account (shared with CardicX) so it shows on the leaderboard and chat
              const t = await acct.token();
              const r = await fetch("/api/profile", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` }, body: JSON.stringify({ handle: v }) });
              const j = await r.json().catch(() => ({}));
              if (r.ok) { setHandle(v); toast(`Handle set to @${v}`); }
              else toast(j.error === "handle_taken" ? "That name is taken, try another" : j.error === "not_found" || r.status === 404 ? "Names save to your account soon" : "Could not save, try again");
            }}>
              <input className="inp" value={h} onChange={(e) => setH(e.target.value)} placeholder="your_handle" maxLength={20} />
              <button className="btn btn-play btn-sm">Save</button>
            </form>
            <p className="muted small" style={{ marginTop: 10 }}>Shown on the leaderboard and used in your invite link on the Mine page.</p>
          </div>
          <div className="card" style={{ borderColor: "rgba(59,120,255,.45)" }}>
            <span className="eyebrow" style={{ color: "var(--cx)" }}>CardicX account</span>
            <p className="muted" style={{ margin: "12px 0 16px" }}>Connect to save progress across devices and redeem your Squeaks rewards in the CardicX Rewards Center.</p>
            <div className="row" style={{ justifyContent: "flex-start" }}>
              {acct.authed
                ? <>
                    <span className="pill green"><span className="dot" /> Signed in as {acct.label}</span>
                    <button className="btn btn-ghost btn-sm" onClick={acct.logout}>Log out</button>
                  </>
                : <button className="btn btn-cx btn-sm" onClick={() => (acct.enabled ? acct.login() : toast("Login switches on once the Privy app ID is added"))}>Log in with CardicX</button>}
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
        </div>
      </section>
    </Shell>
  );
}
