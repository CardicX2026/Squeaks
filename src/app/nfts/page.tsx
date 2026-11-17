"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import { CountUp, Icon, PageHead, Shell } from "@/components/ui";
import { DOCS_NFT, MINT, NFTS, SOCIALS, TOKEN } from "@/lib/content";

const BENEFITS = [
  { i: "stake", t: "Stake your NFT", d: `Earn rewards from the 5% OG allocation of the total ${TOKEN.ticker} supply.` },
  { i: "star", t: "Permanent OG status", d: "Owning a CDXLIV makes you an OG Member for good." },
  { i: "gift", t: "CardicX perks", d: "Eligible premium features at no cost, discounts and OG-only promotions." },
  { i: "rocket", t: "Early access", d: "First in line for new CardicX tools, releases and future collections." },
  { i: "flame", t: "Member-only events", d: "Community events, campaigns and experiences just for holders." },
  { i: "gem", t: "Ecosystem rewards", d: "Eligibility for rewards and incentives across Squeaks and CardicX." },
];

export default function Nfts() {
  const [open, setOpen] = useState<number | null>(null);
  useEffect(() => {
    if (open === null) return;
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(null); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open]);
  const n = open !== null ? NFTS[open] : null;

  return (
    <Shell>
      <PageHead eyebrow="CDXLIV · Series One" title={<>The <span className="yel">OG Membership</span> Pass</>} img="/nft/n02.webp">
        CDXLIV is the first Squeaks collection: 444 hand-styled mice that work as a collectible and as permanent membership across Squeaks and CardicX.
      </PageHead>

      <section className="wrap" style={{ paddingBottom: "clamp(56px, 8vw, 96px)" }}>
        <div className="facts-grid four" data-r>
          <div><span>Collection</span><b>CDXLIV</b></div>
          <div><span>Supply</span><b><CountUp to={444} /></b></div>
          <div><span>OG allocation</span><b>5% of {TOKEN.ticker}</b></div>
          <div><span>Status</span><b>Series A</b></div>
        </div>
      </section>

      <section className="sec light">
        <div className="wrap">
        <div className="sec-head">
          <span className="eyebrow" data-r>Holder benefits</span>
          <h2 className="sec-h" data-r>More than a <em>profile picture.</em></h2>
          <p className="sec-p" data-r>CDXLIV is the long-term membership layer that links Squeaks and CardicX. More utility is added as both ecosystems grow.</p>
        </div>
        <div className="benefits">
          {BENEFITS.map((b, i) => (
            <div className="benefit" key={b.t} data-r style={{ ["--d" as string]: i % 2 }}>
              <span className="ico-box"><Icon n={b.i} /></span>
              <div><b>{b.t}</b><span>{b.d}</span></div>
            </div>
          ))}
        </div>
        </div>
      </section>

      <section className="sec navy" id="mint">
        <div className="wrap split" style={{ alignItems: "start" }}>
          <div>
            <span className="eyebrow" data-r>Mint</span>
            <h2 className="sec-h" data-r>Get on the <em>whitelist.</em></h2>
            <p className="sec-p" data-r>The CDXLIV mint date and price will be announced on Telegram and here. Whitelist members get priority access, and high-XP community members get priority consideration.</p>
            <div className="hero-cta" data-r>
              <a href={SOCIALS[0].h} target="_blank" rel="noreferrer" className="btn btn-play btn-big">Join on Telegram ↗</a>
              <a href={SOCIALS[3].h} target="_blank" rel="noreferrer" className="btn btn-ghost btn-big">Earn XP on Zealy ↗</a>
            </div>
          </div>
          <div data-r>
            <div className="facts-grid four" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <div><span>Status</span><b>{MINT.status}</b></div>
              <div><span>Network</span><b>{TOKEN.chain}</b></div>
              <div><span>Mint date</span><b>{MINT.date || "To be announced"}</b></div>
              <div><span>Price</span><b>{MINT.price || "To be announced"}</b></div>
            </div>
            <div className="path" style={{ gridTemplateColumns: "1fr", gap: 22, marginTop: 30 }}>
              <div className="step"><h3>Join the waitlist</h3><p>Sign up through the Squeaks community and follow Telegram for the announcement.</p></div>
              <div className="step"><h3>Add your Solana wallet</h3><p>Add your wallet address to your dashboard profile so it can be whitelisted.</p></div>
              <div className="step"><h3>Trade after mint</h3><p>{MINT.marketplaces.length ? MINT.marketplaces.map((m) => m.n).join(", ") : "Solana NFT marketplaces will be confirmed closer to the mint date."}</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="sec peach">
        <div className="wrap">
        <div className="row" style={{ marginBottom: 26 }}>
          <div>
            <span className="eyebrow" data-r>The collection</span>
            <h2 className="sec-h" data-r style={{ marginBottom: 0 }}>Meet a few of the <em>444.</em></h2>
          </div>
          <a className="btn btn-dark" href={DOCS_NFT} target="_blank" rel="noreferrer" data-r>Membership details ↗</a>
        </div>
        <div className="gallery">
          {NFTS.map((x, i) => (
            <button key={x.src} className="gcard" onClick={() => setOpen(i)} data-r style={{ ["--d" as string]: i % 4 }} aria-label={`Open ${x.name}`}>
              <div className="im"><img src={x.src} alt={x.name} loading="lazy" /></div>
              <div className="meta">{x.name}<span>CDXLIV</span></div>
            </button>
          ))}
        </div>
        </div>
      </section>

      {n && (
        <div className="lightbox" onClick={() => setOpen(null)} role="dialog" aria-modal aria-label={n.name}>
          <div className="box" onClick={(e) => e.stopPropagation()}>
            <img src={n.src} alt={n.name} />
            <div className="row" style={{ padding: 20 }}>
              <div><b style={{ fontSize: 20 }}>{n.name}</b><div className="muted small">CDXLIV · OG Membership Pass</div></div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setOpen((open! + NFTS.length - 1) % NFTS.length)} aria-label="Previous">←</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setOpen((open! + 1) % NFTS.length)} aria-label="Next">→</button>
                <button className="btn btn-play btn-sm" onClick={() => setOpen(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}
