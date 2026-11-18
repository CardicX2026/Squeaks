"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import { MiniMenu, MiniResult, MiniShell, useMiniRun, type Result } from "@/components/minigame";
import { audio } from "@/game/audio";

// four singers from the CDXLIV crew, each with its own colour and note
const PADS = [
  { img: "/nft/n10.webp", name: "Orbit", color: "#ffc83d" },
  { img: "/nft/n12.webp", name: "Boombox", color: "#7ed9bc" },
  { img: "/nft/n07.webp", name: "Sweet", color: "#f5a3a7" },
  { img: "/nft/n22.webp", name: "Vinyl", color: "#6fb0f0" },
];
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function SaysGame() {
  const run = useMiniRun("says");
  const [phase, setPhase] = useState<"menu" | "watch" | "input" | "over">("menu");
  const [lit, setLit] = useState<number | null>(null);
  const [level, setLevel] = useState(0);
  const [wrong, setWrong] = useState(false);
  const [res, setRes] = useState<Result | null>(null);
  const seq = useRef<number[]>([]);
  const pos = useRef(0);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  const flash = async (i: number, ms: number) => {
    setLit(i); audio().pad(i, ms / 1000);
    await wait(ms);
    setLit(null);
  };
  const playBack = async () => {
    setPhase("watch");
    await wait(650);
    const n = seq.current.length;
    const on = Math.max(230, 520 - n * 18), gap = Math.max(90, 200 - n * 6); // faster every level
    for (const i of seq.current) { if (!alive.current) return; await flash(i, on); await wait(gap); }
    pos.current = 0;
    setPhase("input");
  };
  const nextRound = async () => {
    seq.current.push(Math.floor(Math.random() * 4));
    await playBack();
  };

  const startRound = (asGuest: boolean) => {
    audio().unlock();
    run.begin(asGuest);
    seq.current = []; setLevel(0); setRes(null); setWrong(false);
    audio().sfx("start");
    nextRound();
  };

  const tap = async (i: number) => {
    if (phase !== "input") return;
    flash(i, 220);
    if (seq.current[pos.current] !== i) {
      setPhase("over"); setWrong(true);
      audio().sfx("wrong");
      const cleared = seq.current.length - 1;
      setRes({ score: cleared, best: false, credited: null });
      setRes(await run.finish(cleared));
      return;
    }
    pos.current++;
    if (pos.current === seq.current.length) {
      setLevel(seq.current.length);
      setPhase("watch");
      audio().sfx("level");
      await wait(450);
      nextRound();
    }
  };

  return (
    <MiniShell theme="says">
      {phase === "menu" && (
        <MiniMenu game="says" poster="/games/slot-3.webp" title="Squeaks Says"
          how={["Watch the mice sing a pattern", "Tap them back in the same order", "Each round adds one more note", "It gets faster as you go"]}
          onPlay={() => run.play(startRound)} loginHint={!run.authed} onLogin={run.login} />
      )}
      {phase !== "menu" && (
        <div className={`ss${wrong ? " wrong" : ""}`}>
          <div className="ss-hud">
            <div><small>Level</small><b>{level}</b></div>
            <div className={`ss-status ${phase}`}>{phase === "watch" ? "Watch…" : phase === "input" ? "Your turn!" : "Oops!"}</div>
            <div><small>Notes</small><b>{seq.current.length}</b></div>
          </div>
          <div className="ss-board">
            {PADS.map((p, i) => (
              <button key={p.name} className={`ss-pad${lit === i ? " on" : ""}`} style={{ ["--c" as string]: p.color }} onPointerDown={() => tap(i)} disabled={phase !== "input"} aria-label={p.name}>
                <img src={p.img} alt="" draggable={false} />
                <span>{p.name}</span>
              </button>
            ))}
            <div className="ss-core" aria-hidden><span>SQUEAKS<br />SAYS</span></div>
          </div>
        </div>
      )}
      {phase === "over" && res && <MiniResult r={res} unit="Rounds cleared" onAgain={() => run.play(startRound)} onLogin={run.login} />}
    </MiniShell>
  );
}
