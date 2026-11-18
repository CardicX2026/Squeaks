"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { setRef, TESTING, useAccountState, useGame, useToast } from "@/lib/store";
import { useAccount } from "@/components/auth";
import { CARDICX, DOCS, SOCIALS } from "@/lib/content";
import { FlakeField, SnowCap } from "@/components/winter";

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
  { h: "/", n: "Home" }, { h: "/token", n: "Token" }, { h: "/nfts", n: "NFTs" }, { h: "/play", n: "Arcade" },
  { h: "/mine", n: "Mine" }, { h: "/rewards", n: "Rewards" },
];
export const GAME_NAV = [
  { h: "/play", n: "Arcade" }, { h: "/mine", n: "Mine" }, { h: "/shop", n: "Shop" },
  { h: "/rewards", n: "Rewards" }, { h: "/leaderboard", n: "Leaderboard" }, { h: "/profile", n: "Profile" },
];

/* Colourful tab icons (original artwork, drawn in code) */
function TabIcon({ n }: { n: string }) {
  const s = { width: 26, height: 26, viewBox: "0 0 32 32" };
  if (n === "Home") return (
    <svg {...s}><path d="M4 22a12 12 0 0 1 24 0v4H4z" fill="#e8f3ff" stroke="#7fb3ea" strokeWidth="1.6" /><path d="M8 17h16M6 21.5h20M12 12.5v4.5M20 12.5v4.5M16 17v4.5" stroke="#a9cdf2" strokeWidth="1.3" /><path d="M13 26v-4a3 3 0 0 1 6 0v4z" fill="#f28c3f" /><circle cx="24" cy="7" r="2.2" fill="#fff" stroke="#bcd8f5" /></svg>);
  if (n === "Token") return (
    <svg {...s}><circle cx="16" cy="16" r="12" fill="#ffc83d" stroke="#e09a00" strokeWidth="1.8" /><circle cx="16" cy="16" r="8.5" fill="none" stroke="#f5b000" strokeWidth="1.2" /><path d="M19.5 12.5c-.6-1.2-1.9-1.9-3.5-1.9-2 0-3.4 1-3.4 2.6 0 3.5 7 1.9 7 5.4 0 1.6-1.5 2.7-3.6 2.7-1.7 0-3.1-.7-3.8-2" fill="none" stroke="#8a5a00" strokeWidth="1.9" strokeLinecap="round" /></svg>);
  if (n === "NFTs") return (
    <svg {...s}><path d="M9 5h14l6 8-13 15L3 13z" fill="#f5a3a7" /><path d="M3 13h26L16 28z" fill="#e8818a" /><path d="M9 5l3 8 4-8 4 8 3-8" fill="#ffd3d6" /><path d="M12 13l4 15 4-15" fill="#f5a3a7" /></svg>);
  if (n === "Arcade") return (
    <svg {...s}><path d="M8 9h16a6 6 0 0 1 6 6v3a5 5 0 0 1-9 3l-1-1h-8l-1 1a5 5 0 0 1-9-3v-3a6 6 0 0 1 6-6z" fill="#f28c3f" /><path d="M8 13v5M5.5 15.5h5" stroke="#fff" strokeWidth="2" strokeLinecap="round" /><circle cx="21" cy="14" r="1.6" fill="#ffc83d" /><circle cx="24.5" cy="17" r="1.6" fill="#7ed9bc" /></svg>);
  return (
    <svg {...s}><path d="M7 27 20 12" stroke="#a86a3a" strokeWidth="3.2" strokeLinecap="round" /><path d="M11 6c6-3 13-1 17 4-5-2-10-2-14 1z" fill="#9aa6c4" stroke="#6f7c9d" strokeWidth="1.2" /><path d="M21 22l7-3 1 6h-8z" fill="#ffc83d" /><circle cx="25" cy="22.5" r="1" fill="#e09a00" /></svg>);
}
const TABS = ["/", "/token", "/nfts", "/play", "/mine"].map((h, i) => ({ h, n: ["Home", "Token", "NFTs", "Arcade", "Mine"][i] }));

function SocialIcon({ i }: { i: string }) {
  const p: Record<string, ReactNode> = {
    tg: <path d="M21 4 3 11l6 2 2 6 3-4 5 4z M9 13l9-6" />,
    x: <path d="M4 4l16 16M20 4 4 20" />,
    ig: <><rect x="4" y="4" width="16" height="16" rx="5" /><circle cx="12" cy="12" r="3.6" /><circle cx="17" cy="7" r=".6" /></>,
    zealy: <path d="M12 3l2.6 5.4 5.9.9-4.3 4.1 1 5.9L12 16.6 6.8 19.3l1-5.9L3.5 9.3l5.9-.9z" />,
  };
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{p[i]}</svg>;
}

export function GameNav() {
  const path = usePathname();
  return (
    <nav className="gnav" aria-label="Game">
      {GAME_NAV.map((g) => <Link key={g.h} href={g.h} className={path === g.h || (g.h === "/play" && path.startsWith("/play")) ? "on" : ""}>{g.n}</Link>)}
    </nav>
  );
}

const PEEK_LINES = ["gm, trenches!", "Psst… the arcade is open 🧀", "Have you met the CDXLIV crew?", "Mine Cheese while you sleep", "One login for Squeaks + CardicX"];
/** A mascot that pops up from the corner now and then, waves and says something. Tap to visit the arcade. */
function PeekMouse() {
  const [up, setUp] = useState(false);
  const [line, setLine] = useState(0);
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const cycle = (first: boolean) => {
      t = setTimeout(() => { setLine((l) => (l + 1) % PEEK_LINES.length); setUp(true); t = setTimeout(() => { setUp(false); cycle(false); }, 4200); }, first ? 3500 : 14000);
    };
    cycle(true);
    return () => clearTimeout(t);
  }, []);
  return (
    <Link href="/play" className={`peek${up ? " up" : ""}`} aria-label="Go to the arcade" tabIndex={up ? 0 : -1}>
      <img src="/nft/n19.webp" alt="" />
      <span className="say">{PEEK_LINES[line]}</span>
    </Link>
  );
}

/** Little burst of cheese from any orange button you press. */
function useCheeseBurst() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const onDown = (e: PointerEvent) => {
      const b = (e.target as HTMLElement)?.closest?.(".btn-play, .btn-sky, .gm-play");
      if (!b) return;
      for (let i = 0; i < 9; i++) {
        const el = document.createElement("span");
        el.className = "burst";
        const a = (i / 9) * Math.PI * 2 + Math.random() * 0.4, d = 50 + Math.random() * 50;
        el.style.left = `${e.clientX}px`; el.style.top = `${e.clientY}px`;
        el.style.setProperty("--bx", `${Math.cos(a) * d}px`); el.style.setProperty("--by", `${Math.sin(a) * d - 20}px`); el.style.setProperty("--br", `${(Math.random() - 0.5) * 540}deg`);
        el.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24"><path d="M2.5 13.5 19 5.2a2.4 2.4 0 0 1 2.5 2.3V18a2 2 0 0 1-2 2h-15a2 2 0 0 1-2-2z" fill="#ffd23f"/><circle cx="9" cy="16" r="1.8" fill="#e09a00"/><circle cx="15" cy="13.5" r="1.4" fill="#e09a00"/></svg>';
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 750);
      }
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, []);
}

export function Shell({ children, theme = "site", footer = false }: { children: ReactNode; theme?: "site" | "game"; footer?: boolean }) {
  useCheeseBurst();
  const path = usePathname();
  const g = useGame();
  const acct = useAccount();
  const saved = useAccountState();
  const bal = saved ? { cheese: saved.cheese, points: saved.points } : { cheese: g.cheese, points: g.points };
  const t = useToast();
  useEffect(() => {
    const r = new URLSearchParams(window.location.search).get("ref");
    if (r) setRef(r);
  }, []);
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
    <div className={theme}>
      <Snow />
      {theme === "game" && <FlakeField className="game-flakes" n={8} seed={2} />}
      <nav className="nav" aria-label="Main">
        <div className="wrap nav-in">
          <Link href="/" className="logo" aria-label="Squeaks home">
            <span className="logo-av"><img src="/nft/n11.webp" alt="" /></span>Squeaks<small>$SQKS</small>
          </Link>
          <div className="links">
            {NAV.map((l) => <Link key={l.h} href={l.h} className={on(l.h) ? "on" : ""}>{l.n}</Link>)}
          </div>
          <Link href="/profile" className="wallet" title="Your profile">
            <Cheese /> <b>{fmt(bal.cheese)}</b><span className="sep" /><span className="pts">{fmt(bal.points)} pts</span>
          </Link>
          {acct.enabled && (acct.authed
            ? <button className="btn btn-ghost btn-sm hide-m" onClick={acct.logout} title="Log out">{acct.label}</button>
            : <button className="btn btn-ghost btn-sm" onClick={acct.login}>Log in</button>)}
          <Link href="/play" className="btn btn-play btn-sm hide-m">Play now</Link>
        </div>
        <SnowCap />
      </nav>
      <main>{children}</main>
      {footer && (
      <footer className="navy">
          <div className="wrap">
            <div className="ftop">
              <div>
                <span className="logo"><span className="logo-av"><img src="/nft/n11.webp" alt="" /></span>Squeaks</span>
                <h2 style={{ marginTop: 22 }}>The official token of <span className="yel">CardicX.</span></h2>
                <p className="muted">Meme culture with real products behind it. Squeaks rewards are redeemable in the CardicX Rewards Center.</p>
              </div>
              <div>
                <div className="socials">
                  {SOCIALS.map((s) => <a key={s.n} href={s.h} target="_blank" rel="noreferrer" className="soc" aria-label={s.n} title={s.n}><SocialIcon i={s.i} /></a>)}
                </div>
                <div className="hero-cta" style={{ justifyContent: "inherit", marginTop: 18 }}>
                  <a href={SOCIALS[0].h} target="_blank" rel="noreferrer" className="btn btn-play">Join the whitelist</a>
                  <a href={CARDICX} target="_blank" rel="noreferrer" className="btn btn-cx">Open CardicX ↗</a>
                </div>
              </div>
            </div>
            <div className="foot" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
              <div className="fcol"><b>$SQKS</b><Link href="/token">Token</Link><Link href="/token">Squeakonomics</Link><a href={DOCS} target="_blank" rel="noreferrer">Docs ↗</a></div>
              <div className="fcol"><b>CDXLIV</b><Link href="/nfts">Collection</Link><Link href="/nfts#mint">Mint & whitelist</Link><Link href="/nfts">Membership perks</Link></div>
              <div className="fcol"><b>Arcade</b><Link href="/play">Games</Link><Link href="/mine">Cheese Mine</Link><Link href="/shop">Shop</Link><Link href="/leaderboard">Leaderboard</Link></div>
              <div className="fcol"><b>Community</b>{SOCIALS.map((s) => <a key={s.n} href={s.h} target="_blank" rel="noreferrer">{s.n} ↗</a>)}</div>
            </div>
            <p className="legal">
              $SQKS is a community token. Nothing on this site is financial advice, an offer, or a promise of value, price or returns. Cheese and Squeaks points are in-game balances with no cash value.
              Crypto assets are volatile; only take part with what you can afford to lose, and check that it is allowed where you live.
            </p>
            <div className="copy-row"><span>© {new Date().getFullYear()} Squeaks. All rights reserved.</span><span>Built on Solana · Part of the CardicX ecosystem</span></div>
          </div>
        </footer>
      )}
      {theme === "site" && <PeekMouse />}
      <div className="tabbar">
        {TABS.map((x) => (
          <Link key={x.h} href={x.h} className={on(x.h) ? "on" : ""}>
            <span className="ti"><TabIcon n={x.n} /></span>{x.n}
          </Link>
        ))}
      </div>
      {t && <div className="toast" role="status">{t}</div>}
    </div>
  );
}

/** Light winter snowfall on a canvas. Pauses when the tab is hidden; off for reduced motion. */
export function Snow({ count = 70 }: { count?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const c = ref.current!;
    const ctx = c.getContext("2d")!;
    let w = 0, h = 0, raf = 0, last = performance.now();
    const n = window.innerWidth < 600 ? Math.round(count * 0.55) : count;
    const flakes = Array.from({ length: n }, () => ({ x: Math.random(), y: Math.random(), r: 1 + Math.random() * 2.6, s: 0.25 + Math.random() * 0.6, d: Math.random() * 6.28 }));
    const size = () => { const dpr = Math.min(2, devicePixelRatio || 1); w = innerWidth; h = innerHeight; c.width = w * dpr; c.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    size();
    addEventListener("resize", size);
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      ctx.clearRect(0, 0, w, h);
      for (const f of flakes) {
        f.y += (f.s * 40 * dt) / h * (1 + f.r * 0.3) * 1;
        f.d += dt * 0.8;
        if (f.y > 1.02) { f.y = -0.02; f.x = Math.random(); }
        const x = f.x * w + Math.sin(f.d) * 14, y = f.y * h;
        ctx.beginPath(); ctx.arc(x, y, f.r, 0, 6.283);
        ctx.fillStyle = "rgba(255,255,255,0.92)"; ctx.fill();
        ctx.lineWidth = 0.8; ctx.strokeStyle = "rgba(120,160,215,0.35)"; ctx.stroke();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); removeEventListener("resize", size); };
  }, [count]);
  return <canvas ref={ref} className="snow" aria-hidden />;
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
