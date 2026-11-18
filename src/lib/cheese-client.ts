"use client";
// Browser helper for /api/cheese/*. The browser only asks for actions; the server decides any Cheese.
import { useCallback } from "react";
import { useAccount } from "@/components/auth";
import { addOwned, setBalance } from "@/lib/store";

export class CheeseErr extends Error {
  status: number;
  constructor(status: number, code: string) { super(code); this.status = status; }
}
const MSG: Record<string, string> = {
  insufficient_balance: "Not enough Cheese",
  partner_paused: "Cheese is temporarily unavailable",
  cardicx_not_configured: "Cheese is not connected yet",
  rate_limited: "Slow down a little and try again in a moment",
  not_signed_in: "Log in first",
  not_ready: "Your shift is not finished yet",
  mission_not_complete: "Mission not finished yet",
  implausible_run: "That run could not be verified",
  run_time_invalid: "That run could not be verified",
  bad_ticket: "Session expired, please try again",
};
export const cheeseMsg = (e: unknown) => (e instanceof CheeseErr ? MSG[e.message] ?? "Something went wrong, please try again" : "Network error, please try again");
export const isPaused = (e: unknown) => e instanceof CheeseErr && (e.message === "partner_paused" || e.message === "cardicx_not_configured");

export type CreditRes = { balance: number | null; credited: number; capped: boolean; duplicate?: boolean };

export function useCheese() {
  const acct = useAccount();
  const call = useCallback(async <T,>(path: string, payload?: Record<string, unknown>): Promise<T> => {
    const tk = await acct.token();
    if (!tk) throw new CheeseErr(401, "not_signed_in");
    const r = await fetch(`/api/cheese${path}`, {
      method: payload ? "POST" : "GET",
      headers: { Authorization: `Bearer ${tk}`, ...(payload ? { "Content-Type": "application/json" } : {}) },
      body: payload ? JSON.stringify(payload) : undefined,
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new CheeseErr(r.status, (j as { error?: string }).error || `http_${r.status}`);
    const bal = (j as { balance?: number | null }).balance;
    if (typeof bal === "number") setBalance(bal); // refresh after every credit/debit
    return j as T;
  }, [acct]);
  const refresh = useCallback(async () => {
    try {
      await call<{ balance: number }>("/balance");
      const o = await call<{ owned: string[] }>("/owned");
      o.owned.forEach(addOwned);
    } catch { /* shown as unavailable */ }
  }, [call]);
  return { call, refresh, authed: acct.authed, enabled: acct.enabled, gate: acct.gate, login: acct.login };
}
