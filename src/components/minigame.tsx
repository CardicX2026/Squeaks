"use client";
/* eslint-disable @next/next/no-img-element */
// Shared frame for the arcade mini games: full screen, menu with poster art, results that pay real Cheese.
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Cheese, fmt } from "@/components/ui";
import { GameIcon } from "@/components/game-icons";
import { audio } from "@/game/audio";
import { cheeseMsg, useCheese, type CreditRes } from "@/lib/cheese-client";
import { getGame, setBest, useAccountState, useToast } from "@/lib/store";

export type GameId = "hammer" | "says";
export type Result = { score: number; best: boolean; credited: number | null; capped?: boolean; note?: string; practice?: boolean };

/** Server run for a mini game: ticket at start, the server decides the Cheese at the end. */
export function useMiniRun(game: GameId) {
  const cheese = useCheese();
  const ticket = useRef<string | null>(null);
  const practice = useRef(false);
  const begin = (asGuest: boolean) => {
    practice.current = asGuest;
    ticket.current = null;
    if (!asGuest && cheese.authed) cheese.call<{ ticket: string }>("/run/start", { game }).then((r) => { ticket.current = r.ticket; }).catch(() => {});
  };
  const finish = async (score: number): Promise<Result> => {
    const best = setBest(game, score);
    if (practice.current) return { score, best, credited: null, practice: true };
    const tk = ticket.current; ticket.current = null;
    if (!tk) return { score, best, credited: 0, note: "This round could not be verified, so no Cheese this time." };
    try {
      const r = await cheese.call<CreditRes>("/run/finish", { ticket: tk, score });
      return { score, best, credited: r.credited, capped: r.capped };
    } catch (e) { return { score, best, credited: 0, note: cheeseMsg(e) }; }
  };
  /** Signed in (or login switched off): real round. Otherwise offer login, or a practice round. */
  const play = (startRound: (asGuest: boolean) => void) => (cheese.authed || !cheese.enabled ? startRound(!cheese.enabled) : cheese.gate("play", () => startRound(true)));
  return { begin, finish, play, authed: cheese.authed, login: cheese.login };
}

/** Sound + music toggles and the first-tap audio unlock, shared by every mini game. */
export function useGameAudio() {
  const [snd, setSnd] = useState({ music: true, sfx: true });
  useEffect(() => { const a = audio(); setSnd({ music: a.musicOn, sfx: a.sfxOn }); }, []);
  useEffect(() => {
    const go = () => { const a = audio(); a.unlock(); a.startMusic(); };
    window.addEventListener("pointerdown", go, { once: true });
    window.addEventListener("keydown", go, { once: true });
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("pointerdown", go); window.removeEventListener("keydown", go); audio().stopMusic(); document.body.style.overflow = ""; };
  }, []);
  const toggle = (k: "music" | "sfx") => {
    const a = audio(); a.unlock();
    if (k === "music") a.setMusic(!a.musicOn); else a.setSfx(!a.sfxOn);
    setSnd({ music: a.musicOn, sfx: a.sfxOn });
  };
  return { snd, toggle };
}

export function MiniShell({ children, theme }: { children: ReactNode; theme: "hammer" | "says" }) {
  const saved = useAccountState();
  const t = useToast();
  const { snd, toggle } = useGameAudio();
  return (
    <div className={`gameapp mg mg-${theme}`}>
      <div className="mg-stage">
        <div className="gm-top mg-top">
          <span className="gm-pill"><Cheese s={18} /><b>{saved ? fmt(saved.cheese) : "—"}</b></span>
          <button className={`gm-round sm${snd.music ? "" : " off"}`} onClick={() => toggle("music")} aria-label="Music" aria-pressed={snd.music}><GameIcon n="music" s={20} /></button>
          <button className={`gm-round sm${snd.sfx ? "" : " off"}`} onClick={() => toggle("sfx")} aria-label="Sound effects" aria-pressed={snd.sfx}><GameIcon n="sound" s={20} /></button>
          <Link href="/play" className="gm-round sm" aria-label="Back to the arcade"><GameIcon n="close" s={18} /></Link>
        </div>
        {children}
      </div>
      {t && <div className="toast" role="status">{t}</div>}
    </div>
  );
}

export function MiniMenu({ game, poster, title, how, onPlay, loginHint, onLogin }: { game: GameId; poster: string; title: string; how: string[]; onPlay: () => void; loginHint: boolean; onLogin: () => void }) {
  const best = getGame().bests?.[game] ?? 0;
  return (
    <div className="mg-menu">
      <img className="mg-poster" src={poster} alt={title} />
      <ul className="mg-how">{how.map((h) => <li key={h}>{h}</li>)}</ul>
      <div className="mg-best"><GameIcon n="trophy" s={22} /> Best: <b>{fmt(best)}</b></div>
      <button className="gm-play" onClick={onPlay}>PLAY</button>
      {loginHint && <button className="gm-skin" onClick={onLogin}>Log in to earn Cheese →</button>}
    </div>
  );
}

export function MiniResult({ r, unit, onAgain, onLogin }: { r: Result; unit: string; onAgain: () => void; onLogin: () => void }) {
  return (
    <div className="gm-sheet">
      <div className="gm-panel">
        {r.best && <span className="gm-ribbon">New best!</span>}
        <small className="muted">{unit}</small>
        <h2 className="gm-score">{fmt(r.score)}</h2>
        <div className="gm-earn" style={{ gridTemplateColumns: "1fr" }}>
          <div><Cheese s={22} /><b>{r.credited === null ? (r.practice ? "Practice" : "…") : `+${fmt(r.credited)}`}</b><small>{r.practice ? "No Cheese in practice" : "Cheese"}</small></div>
        </div>
        {r.practice && <button className="btn btn-sky btn-block" onClick={onLogin}>Log in to earn</button>}
        {r.capped && <p className="guestnote">You reached today&apos;s Cheese limit from Squeaks.</p>}
        {r.note && <p className="guestnote">{r.note}</p>}
        <button className="gm-play sm" onClick={onAgain}>Play again</button>
        <Link href="/play" className="btn btn-ghost btn-block">Back to the arcade</Link>
      </div>
    </div>
  );
}
