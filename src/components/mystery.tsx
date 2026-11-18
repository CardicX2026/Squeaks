"use client";
// The CardicX mystery box: found during a Cheese Chase run, opened on the results screen.
// Inside is a CardicX free-access pass with a code that CardicX support redeems.
import { useEffect, useState } from "react";
import { audio } from "@/game/audio";
import { CARDICX_SUPPORT } from "@/lib/content";
import { toast } from "@/lib/store";

/** The CardicX mark: a rounded square with two arrow halves. */
export function CxMark({ s = 22 }: { s?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={s} height={s} aria-hidden>
      <rect x="3" y="3" width="26" height="26" rx="5" fill="none" stroke="currentColor" strokeWidth="2.6" />
      <path d="M9 9 16 16 9 23Z M23 9 16 16 23 23Z" fill="currentColor" />
    </svg>
  );
}

/** The box itself, drawn in code: navy crate, gold ribbon and bow, CardicX mark on the front. */
function Crate() {
  return (
    <svg viewBox="0 0 200 200" className="mx-crate" aria-hidden>
      <defs>
        <linearGradient id="mxBody" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#2b3d9a" /><stop offset="1" stopColor="#0c1440" /></linearGradient>
        <linearGradient id="mxGold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffe48a" /><stop offset="1" stopColor="#e3a215" /></linearGradient>
      </defs>
      <ellipse cx="100" cy="186" rx="70" ry="9" fill="rgba(0,0,0,.35)" />
      <g className="mx-base">
        <rect x="34" y="88" width="132" height="94" rx="10" fill="url(#mxBody)" stroke="#5b78ff" strokeWidth="2" />
        <rect x="91" y="88" width="18" height="94" fill="url(#mxGold)" />
        <g transform="translate(58 112)" fill="#fff" opacity=".95">
          <rect x="0" y="0" width="28" height="28" rx="5" fill="none" stroke="#fff" strokeWidth="3" />
          <path d="M6 6 14 14 6 22Z M22 6 14 14 22 22Z" />
        </g>
      </g>
      <g className="mx-lid">
        <rect x="26" y="66" width="148" height="28" rx="8" fill="url(#mxBody)" stroke="#5b78ff" strokeWidth="2" />
        <rect x="91" y="66" width="18" height="28" fill="url(#mxGold)" />
        <path d="M100 66c-14-26-46-26-40-8 4 10 26 10 40 8Z" fill="url(#mxGold)" stroke="#b97700" strokeWidth="2" />
        <path d="M100 66c14-26 46-26 40-8-4 10-26 10-40 8Z" fill="url(#mxGold)" stroke="#b97700" strokeWidth="2" />
        <circle cx="100" cy="64" r="7" fill="#ffd34d" stroke="#b97700" strokeWidth="2" />
      </g>
    </svg>
  );
}

type Props = { authed: boolean; getCode: () => Promise<string | null>; onLogin: () => void; onDone: () => void };

export function MysteryReveal({ authed, getCode, onLogin, onDone }: Props) {
  const [stage, setStage] = useState<"closed" | "opening" | "open">("closed");
  const [code, setCode] = useState<string | null>(null);
  const [err, setErr] = useState(false);
  const found = new Date().toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

  const open = () => {
    if (stage !== "closed") return;
    audio().unlock(); audio().sfx("reveal");
    setStage("opening");
    if (authed) getCode().then((c) => (c ? setCode(c) : setErr(true))).catch(() => setErr(true));
    setTimeout(() => setStage("open"), 900);
  };
  useEffect(() => { audio().sfx("mystery"); }, []);

  const copy = () => { if (code) navigator.clipboard?.writeText(code).then(() => toast("Code copied")).catch(() => {}); };

  return (
    <div className="gm-sheet mx" onPointerDown={(e) => e.stopPropagation()}>
      {stage !== "open" ? (
        <button className={`mx-box ${stage}`} onClick={open} aria-label="Open the mystery box">
          <span className="mx-rays" aria-hidden />
          <Crate />
          <b>You found a mystery box</b>
          <small>Tap to open</small>
        </button>
      ) : (
        <div className="mx-reveal">
          <div className="mx-card" role="group" aria-label="CardicX free access pass">
            <span className="mx-shine" aria-hidden />
            <div className="mx-card-top"><span className="mx-brand"><CxMark s={22} /> CardicX</span><span className="mx-tag">Squeaks reward</span></div>
            <span className="mx-chip" aria-hidden />
            <h3>Free Access Pass</h3>
            <p className="mx-sub">Free access to the CardicX platform</p>
            <div className="mx-code">
              <small>Redeem code</small>
              <b>{!authed ? "Log in to unlock" : code ?? (err ? "Unavailable" : "Generating…")}</b>
            </div>
            <div className="mx-card-foot"><span>Found in Cheese Chase</span><span>{found}</span></div>
          </div>
          {authed && code && (
            <ol className="mx-steps">
              <li>Take a screenshot of this card.</li>
              <li>Contact support on the CardicX website and send them the screenshot.</li>
              <li>Support checks your code and turns on your free access.</li>
            </ol>
          )}
          {authed && err && <p className="guestnote">We couldn&apos;t create your code right now. Your next box will try again.</p>}
          {!authed && <p className="guestnote">Codes are only given to players who are logged in. Log in, then find the box again on your next run.</p>}
          <div className="mx-actions">
            {authed && code && <button className="btn btn-sky" onClick={copy}>Copy code</button>}
            {authed && code && <a className="btn btn-sky" href={CARDICX_SUPPORT} target="_blank" rel="noopener noreferrer">CardicX support</a>}
            {!authed && <button className="btn btn-sky" onClick={onLogin}>Log in</button>}
          </div>
          <button className="gm-play sm" onClick={onDone}>Continue</button>
        </div>
      )}
    </div>
  );
}
