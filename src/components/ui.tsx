"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { setRef, TESTING, useGame, useToast } from "@/lib/store";
import { CARDICX, DOCS, SOCIALS } from "@/lib/content";

export const fmt = (n: number) => Math.floor(n).toLocaleString("en-US");
export { CARDICX, SOCIALS };

export function Cheese({ s = 16 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" aria-label="Cheese" role="img" style={{ display: "inline-block", verticalAlign: "-0.16em", flex: "none" }}>
      <path d="M2.5 13.5 19 5.2a2.4 2.4 0 0 1 2.5 2.3V18a2 2 0 0 1-2 2h-15a2 2 0 0 1-2-2z" fill="#ffd23f" />
      <path d="M2.5 13.5 19 5.2a2.4 2.4 0 0 1 2.5 2.3v1.2L2.5 14.6z" fill="#ffe680" />
      <circle cx="8" cy="16.6" r="1.7" fill="#e09a00" /><circle cx="14.6" cy="13.6" r="1.4" fill="#e09a00" /><circle cx="17.4" cy="17.4" r="1.1" fill="#e09a00" />
    </svg>
  );
}

const ICONS: Record<string, string> = {
  game: "M6 9h4M8 7v4M15 10h.01M18 8h.01M7 4h10a5 5 0 0 1 5 5v4a4 4 0 0 1-7 2.6L14 15h-4l-1 .6A4 4 0 0 1 2 13V9a5 5 0 0 1 5-5z",
  shirt: "M8 3 3 6l2 5 2-1v11h10V10l2 1 2-5-5-3a4 4 0 0 1-8 0z",
  gem: "M6 3h12l4 6-10 12L2 9zM2 9h20M12 21 8 9l4-6 4 6z",
  stake: "M12 2 3 7l9 5 9-5zM3 12l9 5 9-5M3 17l9 5 9-5",
  vote: "M4 12l5 5L20 6M4 20h16",
  link: "M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1",
  flame: "M12 22c4 0 7-3 7-7 0-5-4-7-5-12-3 3-4 6-4 8-1-1-2-2-2-4-2 2-3 5-3 8 0 4 3 7 7 7z",
  shield: "M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z",
  star: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z",
  gift: "M4 10h16v11H4zM2 7h20v3H2zM12 7v14M12 7C9 7 7 5 8 3.5S12 4 12 7c0-3 3-5 4-3.5S15 7 12 7z",
  rocket: "M5 15c-1.5 1.5-2 5-2 5s3.5-.5 5-2M9 13l2 2M14 4c3-1 6-1 6-1s0 3-1 6l-6 6-5-5z",
  lock: "M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4",
  cart: "M3 4h2l2.5 11h11L21 7H6.2M9 20h.01M18 20h.01",
};
export function Icon({ n, s = 24 }: { n: keyof typeof ICONS | string; s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={ICONS[n] ?? ICONS.star} />
    </svg>
  );
}

/** Animates a number from 0 when it scrolls into view. */
export function CountUp({ to, dur = 1400, suffix = "" }: { to: number; dur?: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [v, setV] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setV(to); return; }
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const tick = (t: number) => {
        const k = Math.min(1, (t - t0) / dur);
        setV(to * (1 - Math.pow(1 - k, 3)));
        if (k < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [to, dur]);
  return <span ref={ref}>{Number.isInteger(to) ? fmt(v) : v.toFixed(1)}{suffix}</span>;
}

const NAV = [
  { h: "/", n: "Home" }, { h: "/token", n: "Token" }, { h: "/nfts", n: "NFTs" }, { h: "/play", n: "Play" },
  { h: "/mine", n: "Mine" }, { h: "/shop", n: "Shop" }, { h: "/rewards", n: "Rewards" },
];
const TABS = [
  { h: "/", n: "Home", i: "M3 11 12 3l9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" },
  { h: "/token", n: "Token", i: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 4v1.6c1.5.3 2.6 1.3 2.8 2.8h-2c-.2-.6-.8-1-1.8-1-1.1 0-1.6.4-1.6 1s.6.9 2 1.2c2.3.5 3.6 1.3 3.6 3.2 0 1.5-1.1 2.6-3 2.9V18h-2v-1.4c-1.7-.3-2.9-1.4-3-3h2c.2.8.9 1.2 2 1.2 1.2 0 1.8-.5 1.8-1.1 0-.7-.6-1-2.2-1.3-2-.4-3.4-1.2-3.4-3.1 0-1.4 1-2.5 2.8-2.8V6z" },
  { h: "/nfts", n: "NFTs", i: "M6 3h12l4 6-10 12L2 9z" },
  { h: "/play", n: "Play", i: "M7 4v16l13-8z" },
  { h: "/mine", n: "Mine", i: "M14 3c3 0 6 2 7 5l-3 1c-1-2-2-3-4-3zM13 7l3 3L6 21l-3-3z" },
];

export function Shell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const g = useGame();
  const t = useToast();
  useEffect(() => {
    const r = new URLSearchParams(window.location.search).get("ref");
    if (r) setRef(r);
  }, []);
  // scroll-reveal for anything marked data-r
  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" });
    const scan = () => document.querySelectorAll("[data-r]:not(.in)").forEach((el) => io.observe(el));
    scan();
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => { io.disconnect(); mo.disconnect(); };
  }, [path]);
  const on = (h: string) => (h === "/" ? path === "/" : path.startsWith(h));
  return (
    <>
      {TESTING && <div className="testbar">Test build · guest mode · everything is free and each tester starts with 999 Cheese</div>}
      <nav className="nav wrap" aria-label="Main">
        <div className="nav-in">
          <Link href="/" className="logo" aria-label="Squeaks home">
            <span className="logo-av"><img src="/nft/n11.webp" alt="" /></span>Squeaks<small>$SQKS</small>
          </Link>
          <div className="links">
            {NAV.map((l) => <Link key={l.h} href={l.h} className={on(l.h) ? "on" : ""}>{l.n}</Link>)}
          </div>
          <Link href="/profile" className="wallet" title="Your profile">
            <Cheese /> <b>{fmt(g.cheese)}</b><span className="sep" /><span className="pts">{fmt(g.points)} pts</span>
          </Link>
          <Link href="/play" className="btn btn-play btn-sm hide-m">Play now</Link>
        </div>
      </nav>
      <main>{children}</main>
      <footer>
        <div className="wrap">
          <div className="foot">
            <div>
              <span className="logo"><span className="logo-av"><img src="/nft/n11.webp" alt="" /></span>Squeaks</span>
              <p style={{ marginTop: 14, maxWidth: 380 }}>A meme-culture community on Solana with real products behind it. Part of the CardicX ecosystem.</p>
            </div>
            <div className="fcol"><b>Explore</b><Link href="/token">$SQKS token</Link><Link href="/nfts">CDXLIV NFTs</Link><Link href="/play">Cheese Chase</Link><Link href="/mine">Cheese Mine</Link><Link href="/shop">Shop</Link></div>
            <div className="fcol"><b>Account</b><Link href="/rewards">Rewards</Link><Link href="/leaderboard">Leaderboard</Link><Link href="/profile">Profile</Link><a href={DOCS} target="_blank" rel="noreferrer">Docs ↗</a><a href={CARDICX} className="cxl" target="_blank" rel="noreferrer">CardicX ↗</a></div>
            <div className="fcol"><b>Community</b>{SOCIALS.map((s) => <a key={s.n} href={s.h} target="_blank" rel="noreferrer">{s.n} ↗</a>)}</div>
          </div>
          <p className="legal">
            $SQKS is a community token. Nothing on this site is financial advice, an offer, or a promise of value, price or returns. Cheese and Squeaks points are in-game balances with no cash value.
            Crypto assets are volatile; only take part with what you can afford to lose, and check that it is allowed where you live.
          </p>
        </div>
      </footer>
      <div className="tabbar">
        {TABS.map((x) => (
          <Link key={x.h} href={x.h} className={on(x.h) ? "on" : ""}>
            <svg width="22" height="22" viewBox="0 0 24 24"><path d={x.i} fill="currentColor" fillRule="evenodd" /></svg>{x.n}
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
      {img && <img className="ph-img" src={img.startsWith("/") ? img : `/mice/${img}.webp`} alt="" />}
    </header>
  );
}

export function Price({ price }: { price: number }) {
  if (TESTING) return <span className="price"><b className="free">Free</b>{price > 0 && <s><Cheese s={13} /> {fmt(price)}</s>}</span>;
  return <span className="price"><Cheese /> <b>{fmt(price)}</b></span>;
}
