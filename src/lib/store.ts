"use client";
import { useSyncExternalStore } from "react";
import { ITEMS, item, MINE_HOURS, MINE_MAX_LEVEL, MINE_RATE, MISSIONS, REF_BONUS, RUN_CHEESE_CAP, mineYield, type Cat, type Item } from "./catalog";

/**
 * Browser-side game state. It never holds a Cheese balance: Cheese lives only on CardicX and is
 * changed only by the Squeaks server. What is kept here: owned items cache, equipped items,
 * boosters, the current Mine ticket, run history and today's stats.
 */
export { ITEMS, item, MINE_HOURS, MINE_MAX_LEVEL, MINE_RATE, MISSIONS, REF_BONUS, RUN_CHEESE_CAP, mineYield };
export type { Cat, Item };
export const DAILY_POINTS_CAP = 300;
export const priceOf = (i: Item) => i.price;
export const mineRate = (level: number) => MINE_RATE * level;

type Run = { t: number; score: number; cheese: number; points: number };
export type S = {
  handle: string;
  points: number;
  best: number;
  runs: Run[];
  owned: string[];
  equip: { Skins: string; Hats: string; Trails: string };
  boosts: Record<string, number>;
  mine: { level: number; start: number | null; shiftMs: number; ticket: string | null; total: number };
  daily: { last: string };
  day: { d: string; runs: number; bigRun: number; mined: number; points: number; claimed: string[] };
  ref: string;
  bests: Record<string, number>;
};

export const today = () => new Date().toISOString().slice(0, 10);
const freshDay = () => ({ d: today(), runs: 0, bigRun: 0, mined: 0, points: 0, claimed: [] as string[] });

const DEF: S = {
  handle: "",
  points: 0,
  best: 0,
  runs: [],
  owned: ["skin_shades"],
  equip: { Skins: "skin_shades", Hats: "", Trails: "" },
  boosts: {},
  mine: { level: 1, start: null, shiftMs: MINE_HOURS * 3600_000, ticket: null, total: 0 },
  daily: { last: "" },
  day: freshDay(),
  ref: "",
  bests: {},
};

const KEY = "sq_state_v3"; // new key: older guest Cheese balances are not carried over
let state: S = DEF;
let loaded = false;
const subs = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { const p = JSON.parse(raw); state = { ...DEF, ...p, mine: { ...DEF.mine, ...p.mine } }; }
    localStorage.removeItem("sq_guest_v2"); // drop the old local Cheese balance
  } catch {}
  if (state.day.d !== today()) state = { ...state, day: freshDay() };
}
function set(fn: (s: S) => S) {
  load();
  const base = state.day.d === today() ? state : { ...state, day: freshDay() };
  state = fn(base);
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
  subs.forEach((f) => f());
}
const sub = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };
export const useGame = () => useSyncExternalStore(sub, () => (load(), state), () => DEF);
export const getGame = () => (load(), state);

/* toast */
let toastMsg = "";
let toastTimer: ReturnType<typeof setTimeout> | undefined;
const tSubs = new Set<() => void>();
export function toast(m: string) {
  toastMsg = m;
  tSubs.forEach((f) => f());
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastMsg = ""; tSubs.forEach((f) => f()); }, 2600);
}
export const useToast = () =>
  useSyncExternalStore((f) => { tSubs.add(f); return () => { tSubs.delete(f); }; }, () => toastMsg, () => "");

/* ---- profile ---- */
export function setHandle(h: string) {
  const handle = h.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20);
  set((s) => ({ ...s, handle }));
  return handle;
}
export function setRef(r: string) {
  const ref = r.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20);
  if (ref) set((s) => (s.ref || s.handle === ref ? s : { ...s, ref }));
}

/* ---- boosters (bought through the server, counted here) ---- */
export function addBoost(id: string) { set((s) => ({ ...s, boosts: { ...s.boosts, [id]: (s.boosts[id] ?? 0) + 1 } })); }
/** Spend one of each chosen booster (only those you own). */
export function spendBoosts(ids: string[]) {
  const b = getGame().boosts;
  const ok = ids.filter((id) => (b[id] ?? 0) > 0);
  set((s) => {
    const nb = { ...s.boosts };
    for (const id of ok) nb[id] -= 1;
    return { ...s, boosts: nb };
  });
  return { magnet: ok.includes("boost_magnet"), double: ok.includes("boost_double"), head: ok.includes("boost_head") };
}

/* ---- owned items (cache of what the server confirmed) ---- */
export function addOwned(id: string) {
  const it = item(id);
  if (!it) return;
  set((s) => (s.owned.includes(id) ? s : { ...s, owned: [...s.owned, id], equip: it.cat === "Boosts" ? s.equip : { ...s.equip, [it.cat]: id } }));
}
export function equip(id: string) {
  const it = item(id);
  if (!it || it.cat === "Boosts") return;
  set((s) => {
    if (!s.owned.includes(id)) return s;
    const cur = s.equip[it.cat as "Skins" | "Hats" | "Trails"];
    const next = cur === id && it.cat !== "Skins" ? "" : id;
    return { ...s, equip: { ...s.equip, [it.cat]: next } };
  });
}

/* ---- runs: the Cheese shown is what CardicX actually credited ---- */
export function finishRun(score: number, credited: number) {
  let points = 0;
  let best = false;
  set((s) => {
    points = Math.max(0, Math.min(Math.floor(score / 100), DAILY_POINTS_CAP - s.day.points));
    best = score > s.best;
    return {
      ...s,
      points: s.points + points,
      best: Math.max(s.best, score),
      runs: [{ t: Date.now(), score, cheese: credited, points }, ...s.runs].slice(0, 20),
      day: { ...s.day, runs: s.day.runs + 1, bigRun: Math.max(s.day.bigRun, credited), points: s.day.points + points },
    };
  });
  return { points, best };
}

/** Personal best per mini game; returns true when it is a new best. */
export function setBest(game: string, score: number) {
  const prev = getGame().bests?.[game] ?? 0;
  if (score <= prev) return false;
  set((s) => ({ ...s, bests: { ...(s.bests ?? {}), [game]: score } }));
  return true;
}

/* ---- mine: the server issues a signed ticket; collecting is decided on the server ---- */
export function mineProgress(s: S, now = Date.now()) {
  if (!s.mine.start) return { active: false, done: false, pct: 0, mined: 0, left: 0 };
  const total = s.mine.shiftMs;
  const el = Math.min(total, Math.max(0, now - s.mine.start));
  return { active: true, done: el >= total, pct: el / total, mined: (el / total) * mineYield(s.mine.level), left: total - el };
}
export function setMineTicket(ticket: string, start: number, shiftMs: number) { set((s) => ({ ...s, mine: { ...s.mine, ticket, start, shiftMs } })); }
export function clearMine(collected: number) { set((s) => ({ ...s, mine: { ...s.mine, ticket: null, start: null, total: s.mine.total + collected }, day: { ...s.day, mined: s.day.mined + 1 } })); }

/* ---- daily + missions (paid by the server; this only tracks what was claimed) ---- */
export const dailyReward = (_streak: number) => 50;
export function canClaimDaily(s: S) { return s.daily.last !== today(); }
export function markDaily() { set((s) => ({ ...s, daily: { last: today() } })); }
export function missionProgress(s: S, id: string) {
  return id === "runs3" ? s.day.runs : id === "big200" ? s.day.bigRun : s.day.mined;
}
export function markMission(id: string) { set((s) => (s.day.claimed.includes(id) ? s : { ...s, day: { ...s.day, claimed: [...s.day.claimed, id] } })); }
export function resetAll() { set(() => ({ ...DEF, day: freshDay() })); }

/* ---- signed-in account: the Cheese balance shown comes from CardicX ---- */
export type AccountState = { handle: string | null; cheese: number; points: number; best_score: number } | null;
let account: AccountState = null;
const aSubs = new Set<() => void>();
export function setAccount(a: AccountState) { account = a ? { handle: a.handle, cheese: a.cheese, points: a.points, best_score: a.best_score } : null; aSubs.forEach((f) => f()); }
export function setBalance(cheese: number) { account = { handle: account?.handle ?? null, points: account?.points ?? 0, best_score: account?.best_score ?? 0, cheese }; aSubs.forEach((f) => f()); }
export const useAccountState = () =>
  useSyncExternalStore((f) => { aSubs.add(f); return () => { aSubs.delete(f); }; }, () => account, () => null);
