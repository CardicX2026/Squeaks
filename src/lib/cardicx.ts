// Server-only client for the CardicX Cheese API. CardicX is the single source of truth for Cheese.
// Never import this from client components; the secret must never reach the browser.
import "server-only";
import { CxError, sendSigned } from "./cardicx-core";

export { CxError };
export type CreditReason = "game_run" | "mine" | "daily" | "mission" | "referral";
export type DebitReason = "shop_item" | "skin" | "boost" | "upgrade";
export type Balance = { user_id: string; balance: number; lifetime: number; rank: string | null };
export type CreditResult = { balance: number; credited: number; capped: boolean; duplicate?: boolean };
export type DebitResult = { balance: number; duplicate?: boolean };
export type LedgerRow = { delta: number; reason: string; source_type: string | null; source_ref: string | null; balance_after: number | null; created_at: string };

const TIMEOUT_MS = 10_000;

function config() {
  const base = process.env.CARDICX_API_BASE;
  const secret = process.env.SQUEAKS_PARTNER_SECRET;
  if (!base || !secret) throw new CxError(503, "cardicx_not_configured");
  return { base: base.replace(/\/+$/, ""), secret };
}
export const cardicxConfigured = () => !!process.env.CARDICX_API_BASE && !!process.env.SQUEAKS_PARTNER_SECRET;

/** Signed request. `raw` is built once by the caller and sent byte-for-byte on every try. */
const signed = <T,>(method: "GET" | "POST", path: string, raw: string) =>
  sendSigned<T>(fetch as unknown as Parameters<typeof sendSigned>[0], config(), method, path, raw, { timeoutMs: TIMEOUT_MS });

const q = (o: Record<string, string | number>) => "?" + new URLSearchParams(Object.entries(o).map(([k, v]) => [k, String(v)])).toString();

export const getBalance = (userId: string) => signed<Balance>("GET", `/balance${q({ user_id: userId })}`, "");
export const getLedger = (userId: string, limit = 30) => signed<{ user_id: string; rows: LedgerRow[] }>("GET", `/ledger${q({ user_id: userId, limit })}`, "");
export function credit(userId: string, amount: number, reason: CreditReason, ref: string) {
  const raw = JSON.stringify({ user_id: userId, amount: Math.floor(amount), reason, ref });
  return signed<CreditResult>("POST", "/credit", raw);
}
export function debit(userId: string, amount: number, reason: DebitReason, ref: string) {
  const raw = JSON.stringify({ user_id: userId, amount: Math.floor(amount), reason, ref });
  return signed<DebitResult>("POST", "/debit", raw);
}

/* ---- profile, leaderboard and chat (stored on CardicX) ---- */
export type CxProfile = { user_id: string; handle: string | null; skin: string | null; best_score: number };
export type CxBoardRow = { handle: string; score: number; skin: string | null; me?: boolean };
export type CxChat = { id: number; user_id: string; handle: string; skin: string | null; body: string; created_at: string };

export const getProfile = (userId: string) => signed<CxProfile>("GET", `/profile${q({ user_id: userId })}`, "");
export function setProfile(userId: string, patch: { handle?: string; skin?: string }) {
  return signed<CxProfile>("POST", "/profile", JSON.stringify({ user_id: userId, ...patch }));
}
/** Best-score submission for a verified run; idempotent on ref (run_<id>). */
export function postScore(userId: string, score: number, ref: string) {
  return signed<{ best_score: number; duplicate?: boolean }>("POST", "/score", JSON.stringify({ user_id: userId, score: Math.floor(score), ref }));
}
export const getLeaderboard = (period: "daily" | "weekly" | "all", limit = 50, userId?: string) =>
  signed<{ period: string; rows: CxBoardRow[] }>("GET", `/leaderboard${q(userId ? { period, limit, user_id: userId } : { period, limit })}`, "");
export function postChat(userId: string, body: string, ref: string) {
  return signed<{ message: CxChat; duplicate?: boolean }>("POST", "/chat", JSON.stringify({ user_id: userId, body, ref }));
}
export const getChat = (afterId = 0, limit = 50) => signed<{ messages: CxChat[] }>("GET", `/chat${q({ after_id: afterId, limit })}`, "");
