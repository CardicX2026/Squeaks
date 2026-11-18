/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { CountUp, Icon, Shell } from "@/components/ui";
import { Allocation } from "@/components/alloc";
import { FlakeField, SnowCap } from "@/components/winter";
import { CARDICX, DOCS, NFTS, SOCIALS, TOKEN } from "@/lib/content";

const PILLARS = [
  { i: "gem", t: "CDXLIV membership", p: "444 NFTs that double as an OG Membership Pass, with staking and perks across Squeaks and CardicX.", h: "/nfts" },
  { i: "game", t: "Gaming & fun", p: "Cheese Chase, the Cheese Mine, daily missions and seasons. Free to play and built to reward the people who show up.", h: "/play" },
  { i: "stake", t: "Staking & rewards", p: "A locked reserve paid out through staking pools over time, plus airdrops for the community that builds this.", h: "/token" },
  { i: "shirt", t: "Merch & shop", p: "Premium merch that carries the brand off-chain, and an in-game shop for skins, trails and boosts.", h: "/shop" },
  { i: "vote", t: "ECO votes", p: "Holders help steer the ecosystem, from how buybacks are used to what gets built next.", h: "/token" },
  { i: "link", t: "Official token of CardicX", p: "$SQKS is the official token of CardicX, and Squeaks rewards are redeemable on the platform.", h: CARDICX },
];

const MARQ = NFTS.slice(0, 14);
const FEATURE = [NFTS[0], NFTS[9], NFTS[13], NFTS[20]];

export default function Home() {
  return (
    <Shell footer>
      {/* HERO — winter */}
      <section className="hero winter">
        <FlakeField n={6} />
        <div className="wrap hero-grid">
          <div>
            <span className="pill" data-r><span className="dot" /> {TOKEN.ticker} · the official token of CardicX</span>
            <h1 data-r style={{ ["--d" as string]: 1 }}>
              The loudest mouse in the{" "}
              <span className="hl">trenches.
                <svg viewBox="0 0 300 30" preserveAspectRatio="none" aria-hidden><path d="M4 22 C 80 6, 200 4, 296 16" fill="none" stroke="#f28c3f" strokeWidth="6" strokeLinecap="round" /></svg>
              </span>
            </h1>
            <p className="lead" data-r style={{ ["--d" as string]: 2 }}>
              Meme culture with real products behind it. Hold {TOKEN.ticker}, collect a CDXLIV membership, play in the arcade,
              and redeem your rewards on CardicX.
            </p>
            <div className="hero-cta" data-r style={{ ["--d" as string]: 3 }}>
              <Link href="/token" className="btn btn-play btn-big">Explore {TOKEN.ticker} <span className="arr">→</span></Link>
              <Link href="/play" className="btn btn-ghost btn-big">Enter the arcade</Link>
            </div>
            <div className="facts" data-r style={{ ["--d" as string]: 4 }}>
              <div><b>1B</b><span>Fixed supply</span></div>
              <div><b><CountUp to={444} /></b><span>CDXLIV NFTs</span></div>
              <div><b>Solana</b><span>Network</span></div>
            </div>
          </div>
          <div className="globe" data-r style={{ ["--d" as string]: 2 }} aria-hidden>
            <div className="glass">
              <img src={NFTS[18].src} alt="" />
              <div className="flakes">{Array.from({ length: 14 }, (_, i) => <i key={i} style={{ left: `${(i * 23) % 96}%`, animationDuration: `${5 + (i % 5)}s`, animationDelay: `${-i * 0.7}s`, width: 4 + (i % 3) * 2, height: 4 + (i % 3) * 2 }} />)}</div>
            </div>
            <div className="base">SQUEAKS</div>
            <span className="chip c1"><span className="wave">👋</span> gm, trenches</span>
          </div>
        </div>
        <svg className="hills" viewBox="0 0 1440 140" preserveAspectRatio="none" aria-hidden>
          <path d="M0 90 C 200 30, 380 120, 620 70 S 1040 20, 1240 80 S 1440 60, 1440 60 V140 H0z" fill="#ffffff" opacity=".7" />
          <path d="M0 110 C 260 70, 460 140, 760 100 S 1180 70, 1440 105 V140 H0z" fill="#f2f8ff" />
        </svg>
      </section>

      <div className="ticker" aria-hidden>
        <div className="marq-track">
          {Array.from({ length: 2 }).flatMap((_, k) =>
            ["$SQKS", "✦", "CDXLIV membership", "✦", "Cheese Chase", "✦", "Built on Solana", "✦", "Powered by CardicX", "✦", "More than hype", "✦"].map((w, i) => <span key={`${k}${i}`}>{w}</span>))}
        </div>
      </div>

      {/* ABOUT — cream with soft art */}
      <section className="sec light bg-art">
        <div className="art" style={{ backgroundImage: "url(/mice/crew.webp)" }} />
        <div className="wrap">
          <div className="split" style={{ alignItems: "end" }}>
            <div>
              <span className="eyebrow" data-r>What is Squeaks</span>
              <h2 className="sec-h" data-r style={{ marginBottom: 0 }}>A community first. <em>A token second.</em></h2>
            </div>
            <div>
              <p className="sec-p" data-r>
                The trenches are loud and chaotic, and Squeaks is the voice in the middle of it. We started as a meme-culture
                community and grew into a brand with things to do, wear and hold, inside an ecosystem people already use.
              </p>
              <div className="hero-cta" data-r style={{ marginTop: 24 }}>
                <a href={DOCS} target="_blank" rel="noreferrer" className="btn btn-dark">Read the docs ↗</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ECOSYSTEM — cream */}
      <section className="sec light" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow" data-r>The ecosystem</span>
            <h2 className="sec-h" data-r>Six reasons to <em>hold, play</em> and stay.</h2>
            <p className="sec-p" data-r>Every part feeds the others. Play earns points, membership unlocks perks, and platform revenue can flow back to the community.</p>
          </div>
          <div className="pillars">
            {PILLARS.map((p, i) => {
              const ext = p.h.startsWith("http");
              const body = (<><span className="ico-box"><Icon n={p.i} /></span><h3>{p.t}</h3><p>{p.p}</p><span className="go">{ext ? "Visit CardicX ↗" : "Learn more →"}</span></>);
              return ext
                ? <a key={p.t} href={p.h} target="_blank" rel="noreferrer" className="pillar" data-r style={{ ["--d" as string]: i % 3 }}>{body}</a>
                : <Link key={p.t} href={p.h} className="pillar" data-r style={{ ["--d" as string]: i % 3 }}>{body}</Link>;
            })}
          </div>
        </div>
      </section>

      {/* TOKENOMICS + LAUNCH — navy */}
      <section className="sec navy" style={{ overflow: "hidden" }}>
        <FlakeField n={5} seed={3} />
        <div className="wrap" style={{ position: "relative" }}>
          <div className="split" style={{ alignItems: "start" }}>
            <div>
              <span className="eyebrow" data-r>Squeakonomics</span>
              <h2 className="sec-h" data-r>One billion. <em>Fixed forever.</em></h2>
              <p className="sec-p" data-r>
                {TOKEN.ticker} has a fixed supply of 1,000,000,000 with no minting after deployment. Ecosystem allocations are
                locked, vested and publicly verifiable, and development funds release only against milestones.
              </p>
              <div className="hero-cta" data-r><Link href="/token" className="btn btn-ghost">Full tokenomics <span className="arr">→</span></Link></div>
            </div>
            <div data-r>
              <div className="supply"><b><CountUp to={1000000000} /></b><span className="muted">total supply</span></div>
              <Allocation />
            </div>
          </div>

          <div style={{ marginTop: "clamp(72px, 10vw, 128px)" }}>
            <div className="sec-head">
              <span className="eyebrow" data-r>The launch path</span>
              <h2 className="sec-h" data-r>Members first, <em>then the market.</em></h2>
            </div>
            <div className="path">
              <div className="step" data-r><span className="tag">Series A</span><h3>CDXLIV NFTs</h3><p>444 membership NFTs form the foundation. Holders share 5% of the total {TOKEN.ticker} supply from inception.</p></div>
              <div className="step" data-r style={{ ["--d" as string]: 1 }}><span className="tag">Series B</span><h3>Public launch</h3><p>{TOKEN.ticker} launches publicly on {TOKEN.launch}. There is no fixed presale price; the market sets it.</p></div>
              <div className="step" data-r style={{ ["--d" as string]: 2 }}><span className="tag">Growth</span><h3>Stake, vote, buy back</h3><p>Staking pools, ECO votes, and buybacks funded by platform revenue that flow back to the community.</p></div>
            </div>
          </div>
        </div>
      </section>

      {/* NFTS — peach */}
      <section className="sec peach">
        <div className="wrap">
          <div className="split" style={{ alignItems: "end", marginBottom: "clamp(36px, 5vw, 64px)" }}>
            <div>
              <span className="eyebrow" data-r>CDXLIV · Series One</span>
              <h2 className="sec-h" data-r style={{ marginBottom: 0 }}>444 mice. <em>One membership.</em></h2>
            </div>
            <div>
              <p className="sec-p" data-r>Each CDXLIV is a collectible and a permanent OG Membership Pass: staking from the 5% OG pool, CardicX perks, early access and member-only events.</p>
              <div className="hero-cta" data-r style={{ marginTop: 22 }}><Link href="/nfts" className="btn btn-dark">See the collection <span className="arr">→</span></Link></div>
            </div>
          </div>
          <div className="nft-mini" data-r>
            <div className="faces">{FEATURE.map((n) => <img key={n.src} src={n.src} alt={n.name} loading="lazy" />)}</div>
            <p className="muted" style={{ maxWidth: 360 }}>444 hand-styled mice. Mint date and price will be announced; the whitelist is open now.</p>
          </div>
        </div>
      </section>

      {/* ARCADE — navy */}
      <section className="sec navy">
        <div className="wrap band">
          <div>
            <span className="eyebrow" data-r>Squeaks arcade</span>
            <h2 className="sec-h" data-r>The arcade is <em>open.</em></h2>
            <p className="sec-p" data-r>Start with Cheese Chase, a full 3D runner through Cheese City. Every run earns Cheese and Squeaks points; more games are on the way.</p>
            <div className="hero-cta" data-r><Link href="/play" className="btn btn-play btn-big">Enter the arcade <span className="arr">→</span></Link></div>
            <div className="mini" data-r>
              <Link href="/mine"><b>Cheese Mine</b><span>24-hour sessions</span></Link>
              <Link href="/rewards"><b>Daily rewards</b><span>Streaks and missions</span></Link>
              <Link href="/leaderboard"><b>Leaderboard</b><span>Daily and weekly</span></Link>
            </div>
          </div>
          <div className="phone" data-r><img src="/mice/chase.webp" alt="Cheese Chase gameplay preview" loading="lazy" /></div>
        </div>
        <div className="wrap" style={{ marginTop: "clamp(64px, 9vw, 112px)" }}>
          <div className="cx capped" data-r><SnowCap seed={1} />
            <div className="pic"><img src="/mice/cardicx.webp" alt="" loading="lazy" /></div>
            <div>
              <h3 style={{ fontSize: "clamp(20px, 2.4vw, 26px)" }}>The official token of CardicX</h3>
              <p className="muted" style={{ marginTop: 8 }}>
                {TOKEN.ticker} is the official token of <a className="lnk" href={CARDICX} target="_blank" rel="noreferrer">CardicX</a>. Your Squeaks points and rewards are redeemable in the CardicX Rewards Center, all on one account.
              </p>
            </div>
            <a className="btn btn-cx" href={CARDICX} target="_blank" rel="noreferrer">Open CardicX ↗</a>
          </div>
        </div>
      </section>

      {/* FINAL — cream */}
      <section className="sec light final">
        <div className="wrap">
          <img src="/mice/crew.webp" alt="The Squeaks crew" data-r loading="lazy" />
          <h2 data-r>Join the loudest <span className="yel">crew</span> in crypto.</h2>
          <p className="sec-p" data-r style={{ margin: "18px auto 0" }}>Launch news, NFT drops and community events, first.</p>
          <div className="hero-cta" data-r style={{ justifyContent: "center" }}>
            {SOCIALS.map((s, i) => <a key={s.n} href={s.h} target="_blank" rel="noreferrer" className={`btn ${i === 0 ? "btn-dark" : "btn-ghost"}`}>{s.n} ↗</a>)}
          </div>
        </div>
      </section>
    </Shell>
  );
}
