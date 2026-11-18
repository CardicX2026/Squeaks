// Pure helpers for the CardicX Cheese API (no Next or secrets here, so they can be unit tested).
import { createHmac } from "node:crypto";

/** hex HMAC-SHA256 of `${timestamp}.${rawBody}` */
export function sign(secret: string, timestamp: string, rawBody: string): string {
  return createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
}

export class CxError extends Error {
  status: number;
  code: string;
  retryAfter?: number;
  constructor(status: number, code: string, retryAfter?: number) {
    super(code);
    this.status = status;
    this.code = code;
    this.retryAfter = retryAfter;
  }
}

/** Only server errors and timeouts are retried; 503 partner_paused is a deliberate state, not retried. */
export function isRetryable(e: unknown): boolean {
  if (e instanceof CxError) return e.status >= 500 && e.status !== 503;
  return true; // network error or timeout
}

/**
 * Runs `attempt` up to 1 + retries times. The caller builds the body (and its ref) once, outside,
 * so every try sends the same body and ref; only the timestamp/signature are fresh per try.
 */
export async function withRetry<T>(attempt: (n: number) => Promise<T>, retries = 2, backoffMs = 300): Promise<T> {
  let last: unknown;
  for (let n = 0; n <= retries; n++) {
    try { return await attempt(n); } catch (e) {
      last = e;
      if (!isRetryable(e) || n === retries) throw e;
      await new Promise((r) => setTimeout(r, backoffMs * (n + 1)));
    }
  }
  throw last;
}

type FetchLike = (url: string, init: { method: string; headers: Record<string, string>; body?: string; signal?: AbortSignal; cache?: "no-store"; redirect?: "error" }) =>
  Promise<{ ok: boolean; status: number; text(): Promise<string>; headers: { get(n: string): string | null } }>;

/**
 * Signed request with retries. `raw` is built once by the caller and sent byte-for-byte on every try
 * (so the same ref is reused); each try gets a fresh timestamp and signature.
 */
export async function sendSigned<T>(fetchImpl: FetchLike, cfg: { base: string; secret: string }, method: "GET" | "POST", path: string, raw: string, opts: { timeoutMs?: number; retries?: number; backoffMs?: number } = {}): Promise<T> {
  return withRetry(async () => {
    const ts = String(Date.now());
    const headers: Record<string, string> = { "X-Partner-Timestamp": ts, "X-Partner-Signature": sign(cfg.secret, ts, raw) };
    if (method === "POST") headers["Content-Type"] = "application/json";
    const r = await fetchImpl(`${cfg.base}${path}`, { method, headers, body: method === "POST" ? raw : undefined, signal: AbortSignal.timeout(opts.timeoutMs ?? 10_000), cache: "no-store", redirect: "error" });
    const text = await r.text();
    let j: Record<string, unknown> = {};
    try { j = text ? JSON.parse(text) : {}; } catch { /* non-JSON error page */ }
    if (!r.ok) throw new CxError(r.status, typeof j.error === "string" ? j.error : `http_${r.status}`, Number(r.headers.get("retry-after")) || undefined);
    return j as T;
  }, opts.retries ?? 2, opts.backoffMs ?? 300);
}
