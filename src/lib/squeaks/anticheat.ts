import type { Config } from "./config";

/** Server-side plausibility check. The server measures time itself; it never trusts the client's duration. */
export function checkRun(elapsedMs: number, score: number, cheese: number, cfg: Config): { ok: true } | { ok: false; reason: string } {
  if (elapsedMs < cfg.run_min_ms) return { ok: false, reason: "too_short" };
  if (elapsedMs > cfg.run_max_ms) return { ok: false, reason: "too_long" };
  const secs = elapsedMs / 1000;
  if (score > secs * cfg.max_score_per_sec + 50) return { ok: false, reason: "score_too_high" };
  if (cheese > secs * cfg.max_cheese_per_sec + 10) return { ok: false, reason: "cheese_too_high" };
  return { ok: true };
}
