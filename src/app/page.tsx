/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { Cheese, CountUp, Icon, Shell } from "@/components/ui";
import { Allocation } from "@/components/alloc";
import { CARDICX, DOCS, NFTS, SOCIALS, TOKEN } from "@/lib/content";

const PILLARS = [
  { i: "gem", t: "CDXLIV membership", p: "444 NFTs that double as an OG Membership Pass, with staking and perks across Squeaks and CardicX.", h: "/nfts" },
  { i: "game", t: "Gaming & fun", p: "Cheese Chase, the Cheese Mine, daily missions and seasons. Free to play, built to reward the people who show up.", h: "/play" },
  { i: "stake", t: "Staking & rewards", p: "A locked reserve paid out through staking pools over time, plus airdrops for the community that builds this.", h: "/token" },
  { i: "shirt", t: "Merch & shop", p: "Premium merch that carries the brand off-chain, and an in-game shop for skins, trails and boosts.", h: "/shop" },
  { i: "vote", t: "ECO votes", p: "Holders help steer the ecosystem, from how buybacks are used to what gets built next.", h: "/token" },
  { i: "link", t: "Built into CardicX", p: "One account across both. Squeaks adds culture and rewards to the CardicX trading platform.", h: CARDICX },
];

const CRUMBS = Array.from({ length: 10 }, (_, i) => ({ left: `${(i * 37) % 100}%`, dur: `${14 + (i % 5) * 4}s`, delay: `${-i * 2.3}s`, size: 14 + (i % 3) * 6 }));

export default function Home() {
  const rowA = NFTS.slice(0, 12), rowB = NFTS.slice(12);
  return (
    <Shell>
      {/* HERO */}
      <section className="hero">
        <div className="crumbs" aria-hidden>
          {CRUMBS.map((c, i) => <span key={i} style={{ left: c.left, animationDuration: c.dur, animationDelay: c.delay }}><Cheese s={c.size} /></span>)}
        </div>
        <div className="wrap hero-grid">
          <div>
            <span className="pill" data-r><span className="dot" /> {TOKEN.ticker} · Community token on {TOKEN.chain}</span>
            <h1 data-r style={{ ["--d" as string]: 1 }}>
              The loudest mouse in the{" "}
              <span className="hl">trenches.
                <svg viewBox="0 0 300 30" preserveAspectRatio="none" aria-hidden><path d="M4 22 C 80 6, 200 4, 296 16" fill="none" stroke="#ff8f3c" strokeWidth="7" strokeLinecap="round" /></svg>
              </span>
            </h1>
            <p className="lead" data-r style={{ ["--d" as string]: 2 }}>
              Squeaks is meme culture with real products behind it: the CDXLIV NFT membership, a game you can actually play,
              premium merch, and rewards that plug straight into CardicX. More than hype, by design.
            </p>
            <div className="hero-cta" data-r style={{ ["--d" as string]: 3 }}>
              <Link href="/token" className="btn btn-play btn-big">Explore $SQKS <span className="arr">→</span></Link>
              <Link href="/nfts" className="btn btn-ghost btn-big">View the NFTs</Link>
            </div>
            <div className="facts" data-r style={{ ["--d" as string]: 4 }}>
              <div><b><CountUp to={1000000000} /></b><span>Fixed supply</span></div>
              <div><b><CountUp to={444} /></b><span>CDXLIV NFTs</span></div>
              <div><b>0</b><span>New mints, ever</span></div>
            </div>
          </div>
          <div className="stack" aria-hidden>
            <div className="glow" /><div className="orbit" />
            <div className="nftc s2"><img src={NFTS[1].src} alt="" /></div>
            <div className="nftc s5"><img src={NFTS[20].src} alt="" /></div>
            <div className="nftc s1"><img src={NFTS[10].src} alt="" /><div className="tagline"><span>CDXLIV</span><b>OG Pass</b></div></div>
            <div className="nftc s3"><img src={NFTS[11].src} alt="" /></div>
            <div className="nftc s4"><img src={NFTS[9].src} alt="" /></div>
            <span className="chip c1"><Cheese s={18} /> Cheese Chase is live</span>
            <span className="chip c2">444 OG passes</span>
          </div>
        </div>
        <div className="ticker" aria-hidden>
          <div className="marq-track">
            {Array.from({ length: 2 }).flatMap((_, k) =>
              ["$SQKS", "★", "CDXLIV MEMBERSHIP", "★", "CHEESE CHASE", "★", "BUILT ON SOLANA", "★", "POWERED BY CARDICX", "★", "MORE THAN HYPE", "★"].map((w, i) => <span key={`${k}${i}`}>{w}</span>))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="sec wrap">
        <div className="split">
          <div>
            <span className="eyebrow" data-r>What is Squeaks</span>
            <h2 className="sec-h" data-r>A community first. <em>A token second.</em></h2>
            <p className="sec-p" data-r>
              The name says it: the trenches are loud and chaotic, and Squeaks is the voice in the middle of it. We started as
              a meme-culture community and grew into a brand with things to do, wear and hold.
            </p>
            <p className="sec-p" data-r style={{ marginTop: 16 }}>
              The goal is a sustainable, community-powered brand. That means real utility over empty promises, and a token
              that sits inside an ecosystem people already use: CardicX, the web3 platform for traders and investors.
            </p>
            <div className="hero-cta" data-r>
              <a href={DOCS} target="_blank" rel="noreferrer" className="btn btn-ghost">Read the docs ↗</a>
            </div>
          </div>
          <div className="marq-col" data-r>
            <div className="marq"><div className="marq-track">{[...rowA, ...rowA].map((n, i) => <div key={i} className="mcard"><img src={n.src} alt={n.name} loading="lazy" /><div>{n.name}<span>CDXLIV</span></div></div>)}</div></div>
            <div className="marq rev" style={{ marginTop: 14 }}><div className="marq-track">{[...rowB, ...rowB].map((n, i) => <div key={i} className="mcard"><img src={n.src} alt={n.name} loading="lazy" /><div>{n.name}<span>CDXLIV</span></div></div>)}</div></div>
          </div>
        </div>
      </section>

      {/* ECOSYSTEM */}
      <section className="sec wrap" style={{ paddingTop: 0 }}>
        <div className="sec-head c">
          <span className="eyebrow" data-r>The ecosystem</span>
          <h2 className="sec-h" data-r>Six reasons to <em>hold, play</em> and stay.</h2>
          <p className="sec-p" data-r>Every part feeds the others. Play earns points, membership unlocks perks, and platform revenue can flow back to the community.</p>
        </div>
        <div className="pillars">
          {PILLARS.map((p, i) => {
            const ext = p.h.startsWith("http");
            const body = (<><span className="ico-box"><Icon n={p.i} /></span><h3>{p.t}</h3><p>{p.p}</p><span className="go">{ext ? "Visit CardicX ↗" : "Learn more →"}</span></>);
            return ext
              ? <a key={p.t} href={p.h} target="_blank" rel="noreferrer" className="card pillar" data-r style={{ ["--d" as string]: i % 3 }}>{body}</a>
              : <Link key={p.t} href={p.h} className="card pillar" data-r style={{ ["--d" as string]: i % 3 }}>{body}</Link>;
          })}
        </div>
      </section>

      {/* TOKENOMICS */}
      <section className="sec wrap" style={{ paddingTop: 0 }}>
        <div className="split" style={{ alignItems: "start" }}>
          <div>
            <span className="eyebrow" data-r>Squeakonomics</span>
            <h2 className="sec-h" data-r>One billion. <em>Fixed forever.</em></h2>
            <p className="sec-p" data-r>
              {TOKEN.ticker} has a fixed supply of 1,000,000,000 with no minting after deployment. Ecosystem allocations are locked,
              vested and publicly verifiable. Development funds sit in a multisig and release only against milestones.
            </p>
            <div className="hero-cta" data-r><Link href="/token" className="btn btn-play">Full tokenomics <span className="arr">→</span></Link></div>
          </div>
          <div className="card" data-r>
            <div className="supply"><b><CountUp to={1000000000} /></b><span className="muted">{TOKEN.ticker} total supply</span></div>
            <Allocation />
          </div>
        </div>
      </section>

      {/* LAUNCH PATH */}
      <section className="sec wrap" style={{ paddingTop: 0 }}>
        <div className="sec-head">
          <span className="eyebrow" data-r>The launch path</span>
          <h2 className="sec-h" data-r>Members first, <em>then the market.</em></h2>
        </div>
        <div className="path">
          <div className="step" data-r><span className="tag">Series A</span><h3>CDXLIV NFTs</h3><p>444 membership NFTs form the foundation. Holders share 5% of the total {TOKEN.ticker} supply from inception.</p></div>
          <div className="step" data-r style={{ ["--d" as string]: 1 }}><span className="tag">Series B</span><h3>Public launch</h3><p>{TOKEN.ticker} launches publicly on {TOKEN.launch}. No fixed presale price: the market sets it.</p></div>
          <div className="step" data-r style={{ ["--d" as string]: 2 }}><span className="tag">Growth</span><h3>Stake, vote, buy back</h3><p>Staking pools, ECO votes, and buybacks funded by platform revenue that flow back to the community.</p></div>
        </div>
      </section>

      {/* GAME */}
      <section className="wrap" style={{ paddingBottom: 96 }}>
        <div className="band" data-r>
          <div>
            <span className="eyebrow">Play to earn points</span>
            <h2 className="sec-h">Cheese Chase is <em>live.</em></h2>
            <p className="sec-p">Run the neon rails of Cheese City in a full 3D runner. Every run earns Cheese and Squeaks points, and your best score lands on the leaderboard.</p>
            <div className="hero-cta"><Link href="/play" className="btn btn-play btn-big">Play now <span className="arr">→</span></Link></div>
            <div className="mini">
              <Link href="/mine"><b>Cheese Mine</b><span>24-hour sessions</span></Link>
              <Link href="/rewards"><b>Daily rewards</b><span>Streaks and missions</span></Link>
              <Link href="/leaderboard"><b>Leaderboard</b><span>Daily and weekly</span></Link>
            </div>
          </div>
          <div className="phone"><img src="/mice/chase.webp" alt="Cheese Chase gameplay preview" /></div>
        </div>
      </section>

      {/* CARDICX */}
      <section className="wrap">
        <div className="cx" data-r>
          <div>
            <span className="eyebrow" style={{ color: "#7da6ff" }}>Powered by CardicX</span>
            <h2 style={{ fontSize: "clamp(26px,3.6vw,38px)", margin: "14px 0 0" }}>One account across Squeaks and CardicX</h2>
            <p className="muted" style={{ margin: "14px 0 22px", fontSize: 17 }}>
              <a className="lnk" href={CARDICX} target="_blank" rel="noreferrer">CardicX</a> brings the trading tools, AI guidance and social features.
              Squeaks brings the culture, engagement and rewards. Your points show up in the CardicX Rewards Center, counted once on one shared ledger.
            </p>
            <a className="btn btn-cx" href={CARDICX} target="_blank" rel="noreferrer">Open CardicX ↗</a>
          </div>
          <div className="pic"><img src="/mice/cardicx.webp" alt="Squeaks mouse in a CardicX hoodie" /></div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="final wrap">
        <img src="/mice/crew.webp" alt="The Squeaks crew" data-r />
        <h2 data-r>Join the loudest <span className="yel">crew</span> in crypto.</h2>
        <p className="sec-p" data-r style={{ margin: "18px auto 0" }}>Follow along for launch news, NFT drops and community events.</p>
        <div className="hero-cta" data-r style={{ justifyContent: "center" }}>
          {SOCIALS.map((s) => <a key={s.n} href={s.h} target="_blank" rel="noreferrer" className="btn btn-ghost">{s.n} ↗</a>)}
        </div>
      </section>
    </Shell>
  );
}
