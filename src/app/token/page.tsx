"use client";
import Link from "next/link";
import { CountUp, Icon, PageHead, Shell } from "@/components/ui";
import { Allocation } from "@/components/alloc";
import { DOCS, DOCS_TOKENOMICS, TOKEN } from "@/lib/content";
import { toast } from "@/lib/store";

export default function Token() {
  const copyCa = () => {
    if (!TOKEN.contract) return toast("The contract address is published here at launch");
    navigator.clipboard?.writeText(TOKEN.contract).then(() => toast("Contract address copied"));
  };
  return (
    <Shell>
      <PageHead eyebrow="Token" title={<>{TOKEN.ticker}, <span className="yel">explained plainly</span></>} img="/nft/n20.webp">
        The community token of the Squeaks ecosystem on {TOKEN.chain}. Here is what it is, how the supply is split, and how it launches.
      </PageHead>

      <section className="wrap">
        <div className="facts-grid" data-r>
          <div><span>Ticker</span><b>{TOKEN.ticker}</b></div>
          <div><span>Chain</span><b>{TOKEN.chain}</b></div>
          <div><span>Total supply</span><b><CountUp to={TOKEN.supply} /></b></div>
          <div><span>Launch</span><b>{TOKEN.launch}</b></div>
          <div><span>Minting</span><b>None, ever</b></div>
        </div>
        <div className="ca" style={{ marginTop: 16 }} data-r>
          <span>{TOKEN.contract || "Contract address: published here at launch. Ignore any address you see elsewhere."}</span>
          <button className="btn btn-play btn-sm" onClick={copyCa}>{TOKEN.contract ? "Copy" : "Not live yet"}</button>
        </div>
      </section>

      <section className="sec wrap">
        <div className="split" style={{ alignItems: "start" }}>
          <div>
            <span className="eyebrow" data-r>Squeakonomics</span>
            <h2 className="sec-h" data-r>Where every <em>$SQKS</em> goes.</h2>
            <p className="sec-p" data-r>
              Most of the supply enters circulation through the public launch. The rest is held in locked, vested and publicly
              verifiable ecosystem reserves, each with a single job.
            </p>
            <p className="muted small" data-r style={{ marginTop: 18 }}>
              Source: <a className="yel" href={DOCS_TOKENOMICS} target="_blank" rel="noreferrer">Squeakonomics in the docs ↗</a>
            </p>
          </div>
          <div className="card" data-r><Allocation notes /></div>
        </div>
      </section>

      <section className="wrap" style={{ paddingBottom: 96 }}>
        <div className="lockgrid">
          <div className="card" data-r><span className="ico-box"><Icon n="lock" /></span><h3>Staking reserve, locked</h3><p>Distributed through staking pools over time, with emissions controlled per pool. No fixed rate is promised.</p></div>
          <div className="card" data-r style={{ ["--d" as string]: 1 }}><span className="ico-box"><Icon n="shield" /></span><h3>Multisig development fund</h3><p>Held in a multisig treasury. Every release needs multisig approval and is tied to development milestones.</p></div>
          <div className="card" data-r style={{ ["--d" as string]: 2 }}><span className="ico-box"><Icon n="rocket" /></span><h3>Vested marketing</h3><p>Marketing and growth funds release on a monthly schedule, never in one lump.</p></div>
        </div>
      </section>

      <section className="wrap" style={{ paddingBottom: 96 }}>
        <div className="sec-head">
          <span className="eyebrow" data-r>Launch</span>
          <h2 className="sec-h" data-r>Two series. <em>No presale price.</em></h2>
        </div>
        <div className="path">
          <div className="step" data-r><span className="tag">Series A</span><h3>CDXLIV foundation</h3><p>444 membership NFTs. Holders receive 5% of the total supply at inception.</p></div>
          <div className="step" data-r style={{ ["--d" as string]: 1 }}><span className="tag">Series B</span><h3>Public launch</h3><p>A fair public launch on {TOKEN.launch}. The price is set by market demand, not a fixed valuation.</p></div>
          <div className="step" data-r style={{ ["--d" as string]: 2 }}><span className="tag">After launch</span><h3>Grow with the platform</h3><p>Staking opens, ECO votes begin, and revenue-funded buybacks can start.</p></div>
        </div>
      </section>

      <section className="wrap" style={{ paddingBottom: 96 }}>
        <div className="sec-head">
          <span className="eyebrow" data-r>Buyback & redistribution</span>
          <h2 className="sec-h" data-r>Platform growth that <em>flows back.</em></h2>
          <p className="sec-p" data-r>Part of the revenue from Squeaks products and services may be used to buy {TOKEN.ticker} on the open market and put it back to work.</p>
        </div>
        <div className="loop">
          <div data-r><b>Revenue</b><span>CardicX premium, subscriptions, advertising, marketplace fees.</span></div>
          <div data-r style={{ ["--d" as string]: 1 }}><b>Buyback</b><span>{TOKEN.ticker} bought on the open market.</span></div>
          <div data-r style={{ ["--d" as string]: 2 }}><b>Redistribute</b><span>Staking rewards, community incentives or treasury reserves.</span></div>
          <div data-r style={{ ["--d" as string]: 3 }}><b>Or burn</b><span>Permanently removed, if governance votes for it.</span></div>
        </div>
      </section>

      <section className="wrap" style={{ paddingBottom: 96 }}>
        <div className="two">
          <div className="card" data-r>
            <span className="eyebrow">In the game</span>
            <h3 style={{ fontSize: 24, margin: "12px 0 10px" }}>Cheese and Squeaks points</h3>
            <p className="muted"><b style={{ color: "var(--text)" }}>Cheese</b> is the in-game currency from runs and the Mine. It buys shop items and has no cash value.</p>
            <p className="muted" style={{ marginTop: 10 }}><b style={{ color: "var(--text)" }}>Squeaks points</b> are a season score with daily caps. They are the only in-game balance that could count toward community rewards, with no guaranteed value or rate.</p>
            <Link href="/play" className="btn btn-ghost btn-sm" style={{ marginTop: 18 }}>Start earning points</Link>
          </div>
          <div className="card faq" data-r style={{ ["--d" as string]: 1 }}>
            <span className="eyebrow">Questions</span>
            <details><summary>Where can I buy $SQKS?</summary><p>Only through the official {TOKEN.launch} launch, using the contract address published on this page. Anyone selling it any other way is not us.</p></details>
            <details><summary>How do I get a share of the 5% OG pool?</summary><p>Hold a CDXLIV NFT. The 444 holders share the OG community allocation.</p></details>
            <details><summary>Is there a team allocation?</summary><p>There is a 3.5% development reserve held in a multisig, released only against milestones and with multisig approval.</p></details>
            <details><summary>Is this financial advice?</summary><p>No. {TOKEN.ticker} is a community token with no promise of value, price or returns. Check the rules where you live before taking part.</p></details>
          </div>
        </div>
        <p className="muted small" style={{ marginTop: 22 }}>Full details in the <a className="yel" href={DOCS} target="_blank" rel="noreferrer">Squeaks docs ↗</a></p>
      </section>
    </Shell>
  );
}
