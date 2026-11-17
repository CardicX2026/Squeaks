"use client";
/**
 * Login with Privy (the same account system CardicX uses).
 * Switched on only when NEXT_PUBLIC_PRIVY_APP_ID is set; otherwise everyone plays as a guest.
 */
import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { PrivyProvider, usePrivy } from "@privy-io/react-auth";
import { setAccount } from "@/lib/store";
import { fetchMe } from "@/lib/sync";

const APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "";
export const AUTH_ENABLED = APP_ID.length > 0;

export type Account = {
  enabled: boolean; ready: boolean; authed: boolean; label: string;
  login: () => void; logout: () => void; token: () => Promise<string | null>;
};
const GUEST: Account = { enabled: false, ready: true, authed: false, label: "", login: () => {}, logout: () => {}, token: async () => null };
const Ctx = createContext<Account>(GUEST);
export const useAccount = () => useContext(Ctx);

function Bridge({ children }: { children: ReactNode }) {
  const p = usePrivy();
  const u = p.user;
  const label = u?.email?.address?.split("@")[0] || u?.twitter?.username || u?.google?.name ||
    (u?.wallet?.address ? `${u.wallet.address.slice(0, 4)}…${u.wallet.address.slice(-4)}` : "") || "Player";
  const value = useMemo<Account>(() => ({
    enabled: true, ready: p.ready, authed: p.authenticated, label,
    login: () => p.login(), logout: () => { p.logout(); setAccount(null); }, token: () => p.getAccessToken(),
  }), [p, label]);
  // load the saved profile and balances from the server after login
  useEffect(() => {
    if (!p.ready || !p.authenticated) return;
    let live = true;
    p.getAccessToken().then((t) => (t ? fetchMe(t) : null)).then((me) => { if (live && me) setAccount(me); }).catch(() => {});
    return () => { live = false; };
  }, [p.ready, p.authenticated, p]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
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
      appearance: { theme: "dark", accentColor: "#f28c3f", logo: "/nft/n11.webp", landingHeader: "Sign in to Squeaks", loginMessage: "Use your CardicX email or wallet. One account for both." },
    }}>
      <Bridge>{children}</Bridge>
    </PrivyProvider>
  );
}
