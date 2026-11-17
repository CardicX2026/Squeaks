"use client";
import { useSyncExternalStore } from "react";

/**
 * Guest test store. Everything lives in the browser (localStorage) so the whole
 * site can be tested without login. TESTING = true makes every price free and
 * starts each tester with 999 Cheese. Before launch: set TESTING to false and
 * move these actions onto the server routes in /api/squeaks (already built).
 */
export const TESTING = true;
export const START_CHEESE = 999;
export const MINE_HOURS = 24;
export const MINE_RATE = 20; // Cheese per hour per level
export const MINE_MAX_LEVEL = 5;
export const RUN_CHEESE_CAP = 600;
export const DAILY_POINTS_CAP = 300;
export const REF_BONUS = 100;

export type Cat = "Skins" | "Hats" | "Trails" | "Boosts";
export type Item = { id: string; cat: Cat; name: string; price: number; note: string; img?: string; glyph?: string; color?: string };

export const ITEMS: Item[] = [
  { id: "skin_shades", cat: "Skins", name: "Street Classic", price: 0, note: "Starter", img: "shades" },
  { id: "skin_chef", cat: "Skins", name: "Chef Brie", price: 1200, note: "Skin", img: "chef" },
  { id: "skin_ninja", cat: "Skins", name: "Dojo Shadow", price: 2400, note: "Rare", img: "ninja" },
  { id: "skin_space", cat: "Skins", name: "Orbit DJ", price: 3000, note: "Epic", img: "space" },
  { id: "skin_safari", cat: "Skins", name: "Safari Scout", price: 900, note: "Skin", img: "safari" },
  { id: "skin_jazz", cat: "Skins", name: "Midnight Jazz", price: 1500, note: "Skin", img: "jazz" },
  { id: "skin_racer", cat: "Skins", name: "Pit Lane", price: 1100, note: "Skin", img: "racer" },
  { id: "skin_gamer", cat: "Skins", name: "Degen Gamer", price: 1800, note: "Rare", img: "gamer" },
  { id: "hat_top", cat: "Hats", name: "Top Hat", price: 450, note: "Hat", glyph: "🎩" },
  { id: "hat_crown", cat: "Hats", name: "Cheese Crown", price: 900, note: "Rare", glyph: "👑" },
  { id: "hat_cap", cat: "Hats", name: "Street Cap", price: 300, note: "Hat", glyph: "🧢" },
  { id: "hat_grad", cat: "Hats", name: "Scholar", price: 350, note: "Hat", glyph: "🎓" },
  { id: "trail_gold", cat: "Trails", name: "Cheese Crumbs", price: 250, note: "Trail", color: "#ffd23f" },
  { id: "trail_star", cat: "Trails", name: "Star Dust", price: 500, note: "Trail", color: "#9db4ff" },
  { id: "trail_fire", cat: "Trails", name: "Fire Paws", price: 650, note: "Trail", color: "#ff6a3c" },
  { id: "trail_mint", cat: "Trails", name: "Mint Rush", price: 800, note: "Trail", color: "#4fffa0" },
  { id: "boost_magnet", cat: "Boosts", name: "Magnet", price: 120, note: "Pulls Cheese from every lane", glyph: "🧲" },
  { id: "boost_double", cat: "Boosts", name: "Double Cheese", price: 200, note: "2x Cheese for one run", glyph: "✨" },
  { id: "boost_head", cat: "Boosts", name: "Head Start", price: 150, note: "Begin at 500 score", glyph: "🚀" },
];
export const item = (id: string) => ITEMS.find((i) => i.id === id);
export const priceOf = (i: Item) => (TESTING ? 0 : i.price);

export const MISSIONS = [
  { id: "runs3", title: "Finish 3 runs", of: 3, cheese: 40, points: 0 },
  { id: "big200", title: "Collect 200 Cheese in one run", of: 200, cheese: 60, points: 5 },
  { id: "mine1", title: "Collect from the Mine", of: 1, cheese: 25, points: 0 },
] as const;

type Run = { t: number; score: number; cheese: number; points: number };
export type S = {
  handle: string;
  cheese: number;
  points: number;
  best: number;
  runs: Run[];
  owned: string[];
  equip: { Skins: string; Hats: string; Trails: string };
  boosts: Record<string, number>;
  mine: { level: number; start: number | null; total: number };
  daily: { last: string; streak: number };
  day: { d: string; runs: number; bigRun: number; mined: number; points: number; claimed: string[] };
  ref: string;
};

export const today = () => new Date().toISOString().slice(0, 10);
const freshDay = () => ({ d: today(), runs: 0, bigRun: 0, mined: 0, points: 0, claimed: [] as string[] });

const DEF: S = {
  handle: "",
  cheese: START_CHEESE,
  points: 0,
  best: 0,
  runs: [],
  owned: ["skin_shades"],
  equip: { Skins: "skin_shades", Hats: "", Trails: "" },
  boosts: {},
  mine: { level: 1, start: null, total: 0 },
  daily: { last: "", streak: 0 },
  day: freshDay(),
  ref: "",
};

const KEY = "sq_guest_v2";
let state: S = DEF;
let loaded = false;
const subs = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = { ...DEF, ...JSON.parse(raw) };
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
  toastTimer = setTimeout(() => { toastMsg = ""; tSubs.forEach((f) => f()); }, 2400);
}
export const useToast = () =>
  useSyncExternalStore((f) => { tSubs.add(f); return () => { tSubs.delete(f); }; }, () => toastMsg, () => "");

/* ---- actions ---- */
export function setHandle(h: string) {
  const handle = h.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20);
  set((s) => ({ ...s, handle }));
  return handle;
}
export function setRef(r: string) {
  const ref = r.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20);
  if (ref) set((s) => (s.ref || s.handle === ref ? s : { ...s, ref }));
}

export function takeBoosts() {
  const b = getGame().boosts;
  const used = { magnet: (b.boost_magnet ?? 0) > 0, double: (b.boost_double ?? 0) > 0, head: (b.boost_head ?? 0) > 0 };
  set((s) => {
    const nb = { ...s.boosts };
    for (const k of Object.keys(nb)) if (nb[k] > 0) nb[k] -= 1;
    return { ...s, boosts: nb };
  });
  return used;
}

export function finishRun(score: number, rawCheese: number) {
  const cheese = Math.min(RUN_CHEESE_CAP, Math.max(0, Math.floor(rawCheese)));
  let points = 0;
  let best = false;
  set((s) => {
    points = Math.max(0, Math.min(Math.floor(score / 100), DAILY_POINTS_CAP - s.day.points));
    best = score > s.best;
    return {
      ...s,
      cheese: s.cheese + cheese,
      points: s.points + points,
      best: Math.max(s.best, score),
      runs: [{ t: Date.now(), score, cheese, points }, ...s.runs].slice(0, 20),
      day: { ...s.day, runs: s.day.runs + 1, bigRun: Math.max(s.day.bigRun, cheese), points: s.day.points + points },
    };
  });
  return { cheese, points, best };
}

export const mineRate = (level: number) => MINE_RATE * level;
export const mineYield = (level: number) => mineRate(level) * MINE_HOURS;
export const mineUpgradeCost = (level: number) => (TESTING ? 0 : 100 * level * level);
export function mineProgress(s: S, now = Date.now()) {
  if (!s.mine.start) return { active: false, done: false, pct: 0, mined: 0, left: 0 };
  const total = MINE_HOURS * 3600_000;
  const el = Math.min(total, Math.max(0, now - s.mine.start));
  return { active: true, done: el >= total, pct: el / total, mined: (el / total) * mineYield(s.mine.level), left: total - el };
}
export function mineStart() { set((s) => (s.mine.start ? s : { ...s, mine: { ...s.mine, start: Date.now() } })); }
export function mineSkip() { set((s) => (s.mine.start ? { ...s, mine: { ...s.mine, start: Date.now() - MINE_HOURS * 3600_000 } } : s)); }
export function mineCollect() {
  let got = 0;
  set((s) => {
    if (!mineProgress(s).done) return s;
    got = mineYield(s.mine.level);
    return { ...s, cheese: s.cheese + got, mine: { ...s.mine, start: null, total: s.mine.total + got }, day: { ...s.day, mined: s.day.mined + 1 } };
  });
  return got;
}
export function mineUpgrade() {
  let ok = false;
  set((s) => {
    const cost = mineUpgradeCost(s.mine.level);
    if (s.mine.level >= MINE_MAX_LEVEL || s.cheese < cost || s.mine.start) return s;
    ok = true;
    return { ...s, cheese: s.cheese - cost, mine: { ...s.mine, level: s.mine.level + 1 } };
  });
  return ok;
}

export function buy(id: string) {
  const it = item(id);
  if (!it) return false;
  let ok = false;
  set((s) => {
    const cost = priceOf(it);
    if (s.cheese < cost) return s;
    if (it.cat === "Boosts") { ok = true; return { ...s, cheese: s.cheese - cost, boosts: { ...s.boosts, [id]: (s.boosts[id] ?? 0) + 1 } }; }
    if (s.owned.includes(id)) return s;
    ok = true;
    return { ...s, cheese: s.cheese - cost, owned: [...s.owned, id], equip: { ...s.equip, [it.cat]: id } };
  });
  return ok;
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

export const dailyReward = (streak: number) => 50 + 10 * Math.min(7, streak);
export function canClaimDaily(s: S) { return s.daily.last !== today(); }
export function claimDaily() {
  let got = 0;
  set((s) => {
    if (!canClaimDaily(s)) return s;
    const y = new Date(Date.now() - 86400_000).toISOString().slice(0, 10);
    const streak = s.daily.last === y ? (s.daily.streak % 7) + 1 : 1;
    got = dailyReward(streak);
    return { ...s, cheese: s.cheese + got, points: s.points + 5, daily: { last: today(), streak } };
  });
  return got;
}
export function missionProgress(s: S, id: string) {
  return id === "runs3" ? s.day.runs : id === "big200" ? s.day.bigRun : s.day.mined;
}
export function claimMission(id: string) {
  const m = MISSIONS.find((x) => x.id === id);
  if (!m) return false;
  let ok = false;
  set((s) => {
    if (s.day.claimed.includes(id) || missionProgress(s, id) < m.of) return s;
    ok = true;
    return { ...s, cheese: s.cheese + m.cheese, points: s.points + m.points, day: { ...s.day, claimed: [...s.day.claimed, id] } };
  });
  return ok;
}
export function resetAll() { set(() => ({ ...DEF, day: freshDay() })); }
