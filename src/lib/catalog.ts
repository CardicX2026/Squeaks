// Shared game catalog: read by the server to decide prices and rewards. No browser state here.
export const MINE_HOURS = 24;
export const MINE_RATE = 20; // Cheese per hour per level
export const MINE_MAX_LEVEL = 5;
export const RUN_CHEESE_CAP = 600;
export const DAILY_CHEESE = 50;
export const REF_BONUS = 100;

export type Cat = "Skins" | "Hats" | "Trails" | "Boosts";
export type Item = { id: string; cat: Cat; name: string; price: number; note: string; img?: string; glyph?: string; color?: string; model?: string };

export const ITEMS: Item[] = [
  { id: "skin_shades", cat: "Skins", name: "Night Runner", price: 0, note: "Starter · 3D", img: "runner" },
  { id: "skin_chef", cat: "Skins", name: "Chef Brie", price: 1200, note: "Playable 3D skin", img: "chef", model: "/models/skins/skin_chef.glb" },
  { id: "skin_ninja", cat: "Skins", name: "Dojo Shadow", price: 2400, note: "Rare", img: "ninja" },
  { id: "skin_space", cat: "Skins", name: "Orbit DJ", price: 3000, note: "Epic", img: "space" },
  { id: "skin_safari", cat: "Skins", name: "Safari Scout", price: 900, note: "Skin", img: "safari" },
  { id: "skin_jazz", cat: "Skins", name: "Midnight Jazz", price: 1500, note: "Skin", img: "jazz" },
  { id: "skin_racer", cat: "Skins", name: "Pit Lane", price: 1100, note: "Playable 3D skin", img: "racer", model: "/models/skins/skin_racer.glb" },
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
export const mineYield = (level: number) => MINE_RATE * level * MINE_HOURS;

export const MISSIONS = [
  { id: "runs3", title: "Finish 3 runs", of: 3, cheese: 40, points: 0 },
  { id: "big200", title: "Collect 200 Cheese in one run", of: 200, cheese: 60, points: 5 },
  { id: "mine1", title: "Collect from the Mine", of: 1, cheese: 25, points: 0 },
] as const;
