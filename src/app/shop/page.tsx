"use client";
/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { PageHead, Price, Shell, GameNav } from "@/components/ui";
import { buy, equip, ITEMS, priceOf, TESTING, toast, useGame, type Cat } from "@/lib/store";

const CATS: Cat[] = ["Skins", "Hats", "Trails", "Boosts"];

export default function Shop() {
  const g = useGame();
  const [cat, setCat] = useState<Cat>("Skins");
  return (
    <Shell theme="game">
      <PageHead eyebrow="Shop" title={<>Dress the <span className="yel">mouse</span></>} img="space">
        Skins, hats and trails show up in Cheese Chase. Boosts are used one per run. {TESTING ? "Everything is free during testing." : "Paid for with Cheese."}
      </PageHead>
      <section className="wrap" style={{ paddingBottom: 0 }}><GameNav /></section>
      <section className="wrap">
        <div className="tabs">
          {CATS.map((c) => <button key={c} className={`tab${c === cat ? " on" : ""}`} onClick={() => setCat(c)}>{c}</button>)}
        </div>
        <div className="grid4">
          {ITEMS.filter((i) => i.cat === cat).map((i) => {
            const boost = i.cat === "Boosts";
            const owned = g.owned.includes(i.id);
            const eq = !boost && g.equip[i.cat as "Skins" | "Hats" | "Trails"] === i.id;
            const count = g.boosts[i.id] ?? 0;
            return (
              <div className={`item${eq ? " eq" : ""}`} key={i.id}>
                <div className="pic">
                  {i.img ? <img src={`/mice/${i.img}.webp`} alt={i.name} /> : i.color ? <span className="swatch" style={{ color: i.color }} /> : i.glyph}
                </div>
                <div className="row" style={{ flexWrap: "nowrap" }}><h3>{i.name}</h3>{boost && count > 0 && <span className="pill">×{count}</span>}</div>
                <p className="muted small">{i.note}</p>
                <div className="row" style={{ marginTop: "auto" }}>
                  {owned && !boost ? <span className="pill green">Owned</span> : <Price price={i.price} />}
                  {boost || !owned ? (
                    <button className="btn btn-play btn-sm" disabled={g.cheese < priceOf(i)} onClick={() => buy(i.id) && toast(boost ? `${i.name} added` : `${i.name} unlocked and equipped`)}>{boost ? "Add" : "Get"}</button>
                  ) : (
                    <button className="btn btn-ghost btn-sm" disabled={eq && i.cat === "Skins"} onClick={() => equip(i.id)}>{eq ? (i.cat === "Skins" ? "Equipped" : "Remove") : "Equip"}</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <p className="muted small" style={{ marginTop: 18 }}>Cheese is an in-game currency with no cash value. Items cannot be traded or withdrawn.</p>
      </section>
    </Shell>
  );
}
