import { db } from "./adapters";

// Tunable numbers. Defaults live here; override any of them with a row in sq_config
// (admin route PUT /api/squeaks/admin/config). Cached for 30 seconds per server instance.
export const DEFAULTS = {
  max_score_per_sec: 120,       // anti-cheat: highest plausible score gain per second
  max_cheese_per_sec: 6,        // anti-cheat: highest plausible cheese pickup per second
  run_min_ms: 5000,             // runs shorter than this are rejected
  run_max_ms: 30 * 60 * 1000,   // active runs older than this expire
  run_start_cooldown_ms: 2000,  // minimum gap between run starts
  max_runs_per_day: 300,
  cheese_per_run_cap: 600,
  points_per_100_score: 1,
  daily_points_cap: 300,        // cap on points earned from runs per UTC day
  burrow_base_per_hour: 20,
  burrow_max_hours: 8,
  burrow_upgrade_base: 100,
  daily_base_cheese: 50,
  daily_streak_step: 10,
  daily_streak_cap: 7,
  daily_points: 5,
} as const;

export type Config = { -readonly [K in keyof typeof DEFAULTS]: number };

let cache: { at: number; cfg: Config } | null = null;

export async function getConfig(): Promise<Config> {
  if (cache && Date.now() - cache.at < 30_000) return cache.cfg;
  const cfg: Config = { ...DEFAULTS };
  const { data } = await db().from("sq_config").select("key,value");
  for (const row of data ?? []) {
    const k = row.key as keyof Config;
    const v = Number(row.value);
    if (k in cfg && Number.isFinite(v)) cfg[k] = v;
  }
  cache = { at: Date.now(), cfg };
  return cfg;
}
export function clearConfigCache() { cache = null; }
