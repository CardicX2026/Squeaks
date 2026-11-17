"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { setRef, TESTING, useGame, useToast } from "@/lib/store";

export const fmt = (n: number) => Math.floor(n).toLocaleString("en-US");
export const CARDICX = "https://cardicx.com";
export const SOCIALS = [
  { n: "Telegram", h: "https://t.me/" },
  { n: "X", h: "https://x.com/" },
  { n: "Discord", h: "https://discord.com/" },
]; // TODO: real community links

export function Cheese({ s = 16 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" aria-label="Cheese" role="img" style={{ display: "inline-block", verticalAlign: "-0.16em", flex: "none" }}>
      <path d="M2.5 13.5 19 5.2a2.4 2.4 0 0 1 2.5 2.3V18a2 2 0 0 1-2 2h-15a2 2 0 0 1-2-2z" fill="#ffd23f" />
      <path d="M2.5 13.5 19 5.2a2.4 2.4 0 0 1 2.5 2.3v1.2L2.5 14.6z" fill="#ffe680" />
      <circle cx="8" cy="16.6" r="1.7" fill="#e09a00" /><circle cx="14.6" cy="13.6" r="1.4" fill="#e09a00" /><circle cx="17.4" cy="17.4" r="1.1" fill="#e09a00" />
    </svg>
  );
}

const NAV = [
  { h: "/", n: "Home" }, { h: "/token", n: "Token" }, { h: "/play", n: "Play" }, { h: "/mine", n: "Mine" },
  { h: "/shop", n: "Shop" }, { h: "/rewards", n: "Rewards" }, { h: "/leaderboard", n: "Leaderboard" },
];
const TABS = [
  { h: "/", n: "Home", i: "M3 11 12 3l9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" },
  { h: "/play", n: "Play", i: "M7 4v16l13-8z" },
  { h: "/mine", n: "Mine", i: "M14 3c3 0 6 2 7 5l-3 1c-1-2-2-3-4-3zM13 7l3 3L6 21l-3-3z" },
  { h: "/rewards", n: "Rewards", i: "M4 9h16v3H4zM6 12h12v9H6zM11 9h2v12h-2zM12 9C9 9 7 7 8 5s4 0 4 4c0-4 3-6 4-4s-1 4-4 4z" },
  { h: "/profile", n: "Profile", i: "M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zm-8 9a8 8 0 0 1 16 0z" },
];

export function Shell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const g = useGame();
  const t = useToast();
  useEffect(() => {
    const r = new URLSearchParams(window.location.search).get("ref");
    if (r) setRef(r);
  }, []);
  const on = (h: string) => (h === "/" ? path === "/" : path.startsWith(h));
  return (
    <>
      {TESTING && <div className="testbar">Test build · guest mode · everything is free and every tester starts with 999 Cheese</div>}
      <nav className="nav wrap">
        <div className="nav-in">
          <Link href="/" className="logo"><i><Cheese s={18} /></i>Squeaks</Link>
          <div className="links">
            {NAV.map((l) => <Link key={l.h} href={l.h} className={on(l.h) ? "on" : ""}>{l.n}</Link>)}
          </div>
          <Link href="/profile" className="wallet" title="Your profile">
            <Cheese /> <b>{fmt(g.cheese)}</b><span className="sep" /><span className="pts">{fmt(g.points)} pts</span>
          </Link>
          <Link href="/play" className="btn btn-play btn-sm hide-m">Play</Link>
        </div>
      </nav>
      <main>{children}</main>
      <footer>
        <div className="wrap foot">
          <div>
            <span className="logo"><i><Cheese s={18} /></i>Squeaks</span>
            <p style={{ marginTop: 10, maxWidth: 380 }}>Cheese and Squeaks points are for play. They have no cash value and nothing on this site is financial advice.</p>
          </div>
          <div className="fcol"><b>Explore</b><Link href="/token">Token</Link><Link href="/play">Cheese Chase</Link><Link href="/mine">Mine</Link><Link href="/shop">Shop</Link></div>
          <div className="fcol"><b>Account</b><Link href="/rewards">Rewards</Link><Link href="/leaderboard">Leaderboard</Link><Link href="/profile">Profile</Link><a href={CARDICX} className="cxl" target="_blank" rel="noreferrer">CardicX ↗</a></div>
          <div className="fcol"><b>Community</b>{SOCIALS.map((s) => <a key={s.n} href={s.h} target="_blank" rel="noreferrer">{s.n} ↗</a>)}</div>
        </div>
      </footer>
      <div className="tabbar">
        {TABS.map((x) => (
          <Link key={x.h} href={x.h} className={on(x.h) ? "on" : ""}>
            <svg width="22" height="22" viewBox="0 0 24 24"><path d={x.i} fill="currentColor" /></svg>{x.n}
          </Link>
        ))}
      </div>
      {t && <div className="toast" role="status">{t}</div>}
    </>
  );
}

export function PageHead({ eyebrow, title, children, img }: { eyebrow: string; title: ReactNode; children?: ReactNode; img?: string }) {
  return (
    <header className="ph wrap">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {children && <p className="lead">{children}</p>}
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {img && <img className="ph-img" src={`/mice/${img}.webp`} alt="" />}
    </header>
  );
}

export function Price({ price }: { price: number }) {
  if (TESTING) return <span className="price"><b className="free">Free</b>{price > 0 && <s><Cheese s={13} /> {fmt(price)}</s>}</span>;
  return <span className="price"><Cheese /> <b>{fmt(price)}</b></span>;
}

export function LiveStats() {
  const [top, setTop] = useState<number | null>(null);
  useEffect(() => {
    fetch("/api/squeaks/leaderboard?period=all&limit=1").then((r) => (r.ok ? r.json() : null)).then((j) => {
      const row = (j?.rows ?? j?.data?.rows)?.[0];
      if (row) setTop(Number(row.score ?? row.best_score ?? 0));
    }).catch(() => {});
  }, []);
  return (
    <div className="stats">
      <div className="stat"><b>—</b><span>Players</span></div>
      <div className="stat"><b>—</b><span>Runs today</span></div>
      <div className="stat"><b>{top ? fmt(top) : "—"}</b><span>Top score</span></div>
    </div>
  );
}
