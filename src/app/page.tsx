/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { CARDICX, LiveStats, Shell } from "@/components/ui";

const EXPLORE = [
  { h: "/play", t: "Cheese Chase", p: "The endless runner. Every run earns Cheese and adds to your score.", img: "chase", wide: true },
  { h: "/mine", t: "The Mine", p: "Start a 24-hour session, come back, collect your Cheese and start again.", img: "chef", wide: true },
  { h: "/shop", t: "Shop", p: "Skins, hats, trails and boosts.", img: "space" },
  { h: "/rewards", t: "Rewards", p: "Daily reward, streaks and missions.", img: "cozy" },
  { h: "/leaderboard", t: "Leaderboard", p: "Daily and weekly rankings.", img: "karate" },
];

export default function Home() {
  return (
    <Shell>
      <section className="hero wrap">
        <div className="hero-grid">
          <div>
            <span className="eyebrow">The community token of the CardicX ecosystem</span>
            <h1>Squeaks is a token you <em>earn a place in</em>, not one you are sold.</h1>
            <p className="lead">
              Squeaks begins as a community and a set of games. Taking part earns Squeaks points, recorded on one ledger
              shared with CardicX. The token itself comes later, on-chain, once its terms are final.
            </p>
            <div className="hero-cta">
              <Link href="/token" className="btn btn-play btn-big">Read about the token</Link>
              <Link href="/play" className="btn btn-ghost btn-big">Play Cheese Chase</Link>
            </div>
          </div>
          <div className="collage" aria-hidden>
            <div className="m c1"><img src="/mice/sqks.webp" alt="" /></div>
            <div className="m c2"><img src="/mice/dj.webp" alt="" /></div>
            <div className="m c3"><img src="/mice/karate.webp" alt="" /></div>
            <div className="m c4"><img src="/mice/gamer.webp" alt="" /></div>
            <div className="m c5"><img src="/mice/window.webp" alt="" /></div>
          </div>
        </div>
        <LiveStats />
      </section>

      <section className="sec wrap">
        <span className="eyebrow">What Squeaks is</span>
        <h2 className="sec-h">Three things, in this order.</h2>
        <p className="sec-p">Most tokens start with a chart. Squeaks starts with people, gives them something to do, and only then becomes a token.</p>
        <div className="three" style={{ marginTop: 30 }}>
          <div className="card pillar"><span className="num">1</span><h3>A community</h3><p>A mouse-themed collective that grew up around CardicX: collectors, traders and players who share one identity and one set of mascots.</p></div>
          <div className="card pillar"><span className="num">2</span><h3>A place to play</h3><p>Cheese Chase, the Mine, missions and a shop. Free to play, open to guests, and built so that effort counts and shortcuts do not.</p></div>
          <div className="card pillar"><span className="num">3</span><h3>A token, later</h3><p>Squeaks will exist on-chain after launch. Until the contract, supply and allocation are final, none of them are announced or implied.</p></div>
        </div>
      </section>

      <section className="sec wrap" style={{ paddingTop: 0 }}>
        <span className="eyebrow">How it works</span>
        <h2 className="sec-h">From first run to season end.</h2>
        <div className="steps">
          <div className="step"><h3>Start as a guest</h3><p>No wallet and no sign-up to try it. Log in with your CardicX account when you want progress saved.</p></div>
          <div className="step"><h3>Play and mine</h3><p>Runs and 24-hour Mine sessions produce Cheese, the in-game currency you spend in the shop.</p></div>
          <div className="step"><h3>Earn Squeaks points</h3><p>Scores and missions add to your season points. Daily caps keep it fair for people with normal lives.</p></div>
          <div className="step"><h3>Season snapshot</h3><p>Each season ends with a recorded standing. Points are the only thing that could count toward the token.</p></div>
        </div>
      </section>

      <section className="sec wrap" style={{ paddingTop: 0 }}>
        <span className="eyebrow">Explore</span>
        <h2 className="sec-h">Everything has its own room.</h2>
        <div className="explore">
          {EXPLORE.map((e) => (
            <Link key={e.h} href={e.h} className={`ex${e.wide ? " wide" : ""}`}>
              <h3>{e.t}</h3><p>{e.p}</p><span className="go">Open →</span>
              <img src={`/mice/${e.img}.webp`} alt="" />
            </Link>
          ))}
        </div>
      </section>

      <section className="sec wrap" style={{ paddingTop: 0 }}>
        <span className="eyebrow">The economy</span>
        <h2 className="sec-h">Two balances and one token. Kept separate on purpose.</h2>
        <div className="tblwrap">
          <table className="tbl">
            <thead><tr><th></th><th>What it is</th><th>Where it comes from</th><th>What it is worth</th></tr></thead>
            <tbody>
              <tr><td className="yel">Cheese</td><td>In-game currency</td><td>Runs, the Mine, daily rewards, missions</td><td>Shop items only. No cash value.</td></tr>
              <tr><td style={{ color: "var(--peach)" }}>Squeaks points</td><td>Season score</td><td>Run scores and missions, with daily caps</td><td>No guaranteed value or conversion rate.</td></tr>
              <tr><td>Squeaks token</td><td>On-chain asset</td><td>Not launched</td><td>Nothing is promised until terms are final.</td></tr>
            </tbody>
          </table>
        </div>
        <p className="note" style={{ marginTop: 24 }}>We do not quote a price, a yield, an amount or a launch date. When those exist, they will be published on the Token page first.</p>
      </section>

      <section className="wrap" style={{ paddingBottom: 40 }}>
        <div className="cx">
          <div>
            <h2 style={{ fontSize: "clamp(24px,3.6vw,34px)" }}>One account across Squeaks and CardicX</h2>
            <p className="muted" style={{ margin: "12px 0 20px", fontSize: 17 }}>
              Squeaks is its own site with its own personality, but your <a className="lnk" href={CARDICX} target="_blank" rel="noreferrer">CardicX</a> login works on both. Squeaks points appear in the CardicX Rewards Center and are counted once, on one shared ledger.
            </p>
            <a className="btn btn-cx" href={CARDICX} target="_blank" rel="noreferrer">Open CardicX ↗</a>
          </div>
          <div className="pic"><img src="/mice/cardicx.webp" alt="Squeaks mouse in a CardicX hoodie" /></div>
        </div>
      </section>
    </Shell>
  );
}
