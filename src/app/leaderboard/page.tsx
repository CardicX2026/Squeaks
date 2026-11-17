"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useState } from "react";
import { fmt, PageHead, Shell, GameNav } from "@/components/ui";
import { item, useGame } from "@/lib/store";

type Row = { handle: string; score: number; img: string; me?: boolean };
const AV = ["shades", "icecream", "skater", "gamer", "karate", "dj", "chef", "space", "jazz", "safari"];
const SAMPLE: Row[] = [
  ["brie_runner", 9210], ["goudagirl", 8480], ["cdxliv_king", 7955], ["nightcheddar", 6320], ["sensei_squeak", 5875],
  ["djmozza", 5340], ["chef_brie", 4410], ["orbit_mouse", 3980], ["smoothjazz", 3120], ["scout", 2450],
].map(([handle, score], i) => ({ handle: handle as string, score: score as number, img: AV[i] }));

export default function Leaderboard() {
  const g = useGame();
  const [period, setPeriod] = useState<"daily" | "weekly">("daily");
  const [live, setLive] = useState<Row[] | null>(null);

  useEffect(() => {
    let on = true;
    fetch(`/api/squeaks/leaderboard?period=${period}&limit=20`).then((r) => (r.ok ? r.json() : null)).then((j) => {
      const raw = j?.rows ?? j?.data?.rows;
      if (!on) return;
      setLive(Array.isArray(raw) && raw.length
        ? raw.map((r: Record<string, unknown>, i: number) => ({ handle: String(r.handle ?? `mouse_${i + 1}`), score: Number(r.score ?? r.best_score ?? 0), img: AV[i % AV.length] }))
        : null);
    }).catch(() => on && setLive(null));
    return () => { on = false; };
  }, [period]);

  const base = live ?? SAMPLE.map((r) => ({ ...r, score: period === "weekly" ? Math.round(r.score * 1.6) : r.score }));
  const rows: Row[] = g.best > 0 && !live
    ? [...base, { handle: g.handle || "you (guest)", score: g.best, img: item(g.equip.Skins)?.img ?? "shades", me: true }].sort((a, b) => b.score - a.score)
    : base;

  return (
    <Shell theme="game">
      <PageHead eyebrow="Leaderboard" title={<>Top <span className="yel">runners</span></>} img="karate">
        Best single run per player. Daily resets at 00:00 UTC, weekly on Monday. Seasons come later.
      </PageHead>
      <section className="wrap" style={{ paddingBottom: 0 }}><GameNav /></section>
      <section className="wrap" style={{ maxWidth: 760 }}>
        <div className="card">
          <div className="row" style={{ marginBottom: 14 }}>
            <div className="tabs">
              {(["daily", "weekly"] as const).map((p) => <button key={p} className={`tab${p === period ? " on" : ""}`} onClick={() => setPeriod(p)}>{p[0].toUpperCase() + p.slice(1)}</button>)}
            </div>
            <span className={`pill ${live ? "green" : "gray"}`}>{live ? "Live" : "Sample data"}</span>
          </div>
          {rows.map((r, i) => (
            <div key={r.handle + i} className={`lb-row${i === 0 ? " r1" : ""}${r.me ? " me" : ""}`}>
              <span className="rk">{i + 1}</span>
              <span className="av"><img src={`/mice/${r.img}.webp`} alt="" /></span>
              <b>{r.handle}</b>
              <span className="sc">{fmt(r.score)}</span>
            </div>
          ))}
          {!live && <p className="muted small" style={{ marginTop: 14 }}>The other names are placeholders until the live board is connected. Your own best run is real.</p>}
        </div>
        <div style={{ marginTop: 20, textAlign: "center" }}><Link href="/play" className="btn btn-play">Beat your best: {fmt(g.best)}</Link></div>
      </section>
    </Shell>
  );
}
