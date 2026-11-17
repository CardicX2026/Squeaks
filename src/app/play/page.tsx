"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useState } from "react";
import { Cheese, fmt, GameNav, PageHead, Shell } from "@/components/ui";
import { GAMES } from "@/lib/content";
import { useGame } from "@/lib/store";

/** Game artwork: tries public/games/<slot>, then a fallback, then a styled placeholder. */
function Art({ img, fallback, name }: { img: string; fallback: string; name: string }) {
  const [src, setSrc] = useState(img);
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="ph-art">
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
        <b>Coming soon</b>
      </div>
    );
  }
  return <img src={src} alt={name} onError={() => (fallback && src !== fallback ? setSrc(fallback) : setFailed(true))} />;
}

export default function Arcade() {
  const g = useGame();
  return (
    <Shell theme="game">
      <PageHead eyebrow="Squeaks arcade" title={<>Pick a <span className="yel">game.</span></>} img="/nft/n10.webp">
        Every game earns Cheese and Squeaks points. Cheese Chase is live now, with more on the way.
      </PageHead>
      <section className="wrap" style={{ paddingBottom: "clamp(56px, 8vw, 96px)" }}>
        <GameNav />
        <div className="statline" data-r>
          <span><Cheese /> Cheese<b>{fmt(g.cheese)}</b></span>
          <span>Points<b>{fmt(g.points)}</b></span>
          <span>Best run<b>{fmt(g.best)}</b></span>
        </div>
        <div className="games">
          {GAMES.map((x, i) => {
            const inner = (
              <>
                <div className="art">
                  <span className={`pill badge ${x.live ? "green" : "gray"}`}>{x.live ? <><span className="dot" /> Live</> : "Soon"}</span>
                  <Art img={x.img} fallback={x.fallback} name={x.name} />
                </div>
                <div className="body">
                  <h3>{x.name}</h3>
                  <p>{x.desc}</p>
                  {x.live ? <span className="btn btn-play" style={{ justifySelf: "start" }}>Play now <span className="arr">→</span></span>
                    : <span className="btn btn-ghost" style={{ justifySelf: "start", opacity: 0.6 }}>Locked</span>}
                </div>
              </>
            );
            return x.live
              ? <Link key={x.id} href={x.href} className="gcardx live" data-r style={{ ["--d" as string]: i }}>{inner}</Link>
              : <div key={x.id} className="gcardx" data-r style={{ ["--d" as string]: i }} aria-disabled>{inner}</div>;
          })}
        </div>
      </section>
    </Shell>
  );
}
