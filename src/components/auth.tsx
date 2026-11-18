"use client";
/**
 * Login with Privy (the same app and wallets as CardicX).
 * Switched on only when NEXT_PUBLIC_PRIVY_APP_ID is set; otherwise everyone plays as a guest.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { PrivyProvider, useLogin, usePrivy } from "@privy-io/react-auth";
import { addOwned, setAccount, setBalance, toast } from "@/lib/store";
import { CARDICX } from "@/lib/content";

const APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "";
export const AUTH_ENABLED = APP_ID.length > 0;

export type GateReason = "mine" | "play" | "claim" | "shop";
export type Account = {
  enabled: boolean; ready: boolean; authed: boolean; label: string;
  login: () => void; logout: () => void; token: () => Promise<string | null>;
  /** Ask to log in before an action that earns. `onGuest` offers a no-rewards guest option. */
  gate: (reason: GateReason, onGuest?: () => void) => void;
};
const GUEST: Account = { enabled: false, ready: true, authed: false, label: "", login: () => {}, logout: () => {}, token: async () => null, gate: (_r, g) => g?.() };
const Ctx = createContext<Account>(GUEST);
export const useAccount = () => useContext(Ctx);

const GATE_COPY: Record<GateReason, { t: string; d: string }> = {
  mine: { t: "Log in to start mining", d: "Your Cheese Mine runs on your account, so your shifts and Cheese are saved wherever you play." },
  play: { t: "Log in to earn", d: "Signed-in runs earn Cheese and Squeaks points. You can still play as a guest for practice, without rewards." },
  claim: { t: "Log in to claim", d: "Rewards are paid to your account, so they stay safe and show up on CardicX too." },
  shop: { t: "Log in to shop", d: "The shop uses your Cheese balance, the same Cheese you see on CardicX." },
};

function Bridge({ children }: { children: ReactNode }) {
  const p = usePrivy();
  const [welcome, setWelcome] = useState(false);
  const [gate, setGate] = useState<{ reason: GateReason; onGuest?: () => void } | null>(null);
  const afterLogin = useRef<(() => void) | null>(null);
  const { login } = useLogin({
    onComplete: ({ isNewUser, wasAlreadyAuthenticated }) => {
      if (wasAlreadyAuthenticated) return;
      setGate(null);
      if (isNewUser) setWelcome(true);
      else toast("Welcome back! Your account is synced with CardicX");
      afterLogin.current?.(); afterLogin.current = null;
    },
  });
  const u = p.user;
  const label = u?.email?.address?.split("@")[0] ||
    (u?.wallet?.address ? `${u.wallet.address.slice(0, 4)}…${u.wallet.address.slice(-4)}` : "") || "Player";
  const openGate = useCallback((reason: GateReason, onGuest?: () => void) => setGate({ reason, onGuest }), []);
  const value = useMemo<Account>(() => ({
    enabled: true, ready: p.ready, authed: p.authenticated, label,
    login: () => login(), logout: () => { p.logout(); setAccount(null); }, token: () => p.getAccessToken(), gate: openGate,
  }), [p, label, login, openGate]);
  // load the saved profile and balances from the server after login
  useEffect(() => {
    if (!p.ready || !p.authenticated) return;
    let live = true;
    // Cheese comes only from CardicX (through our server); owned items are recovered from purchase refs
    p.getAccessToken().then(async (t) => {
      if (!t || !live) return;
      const h = { Authorization: `Bearer ${t}` };
      const b = await fetch("/api/cheese/balance", { headers: h }).then((r) => (r.ok ? r.json() : null));
      if (live && typeof b?.balance === "number") setBalance(b.balance);
      const o = await fetch("/api/cheese/owned", { headers: h }).then((r) => (r.ok ? r.json() : null));
      if (live && Array.isArray(o?.owned)) o.owned.forEach((id: string) => addOwned(id));
    }).catch(() => {});
    return () => { live = false; };
  }, [p.ready, p.authenticated, p]);

  return (
    <Ctx.Provider value={value}>
      {children}
      {gate && (
        <div className="snowmodal" role="dialog" aria-modal aria-label={GATE_COPY[gate.reason].t} onClick={() => setGate(null)}>
          <div className="box" onClick={(e) => e.stopPropagation()}>
            <img src="/nft/n19.webp" alt="" className="av" />
            <h2>{GATE_COPY[gate.reason].t}</h2>
            <p>{GATE_COPY[gate.reason].d}</p>
            <button className="btn btn-sky btn-block" onClick={() => login()}>Log in or sign up</button>
            {gate.onGuest && <button className="btn btn-ghost btn-block" onClick={() => { const g = gate.onGuest; setGate(null); g?.(); }}>Play as guest (no rewards)</button>}
            <small>One account for Squeaks and CardicX.</small>
          </div>
        </div>
      )}
      {welcome && (
        <div className="snowmodal" role="dialog" aria-modal aria-label="Welcome to Squeaks">
          <div className="box">
            <img src="/nft/n11.webp" alt="" className="av" />
            <h2>Welcome to Squeaks!</h2>
            <p>Your account is ready. <b>This same login is your CardicX account.</b> Use the same email or wallet on CardicX to redeem your Squeaks rewards, and both stay in sync automatically.</p>
            <ol>
              <li>Play, mine and claim here to earn Cheese and points.</li>
              <li>Sign in on CardicX with the same email or wallet.</li>
              <li>Redeem your rewards in the CardicX Rewards Center.</li>
            </ol>
            <button className="btn btn-sky btn-block" onClick={() => setWelcome(false)}>Got it, let&apos;s play</button>
            <a className="btn btn-ghost btn-block" href={CARDICX} target="_blank" rel="noreferrer">Open CardicX ↗</a>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  if (!AUTH_ENABLED) return <>{children}</>;
  return (
    <PrivyProvider appId={APP_ID} config={{
      // Same Privy app and wallet rules as CardicX, so one login = the same user and the same wallets on both sites.
      loginMethods: ["email", "wallet"],
      embeddedWallets: {
        showWalletUIs: false,
        ethereum: { createOnLogin: "users-without-wallets" },
        solana: { createOnLogin: "users-without-wallets" },
      },
      // Snowy look; finer styling lives in globals.css under "Sign-in pop-up".
      appearance: { theme: "light", accentColor: "#3a8dde", logo: "/nft/n11.webp", landingHeader: "Sign in to Squeaks", loginMessage: "Use your CardicX email or wallet. One account for both.", showWalletLoginFirst: false },
    }}>
      <Bridge>{children}</Bridge>
    </PrivyProvider>
  );
}
