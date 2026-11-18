// Generate game assets with the Meshy API. Reads MESHY_API_KEY from .env.local.
// Usage: node scripts/meshy-assets.mjs [jobName ...]   (no names = all jobs)
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname } from "node:path";

const KEY = readFileSync(".env.local", "utf8").match(/^MESHY_API_KEY=(.+)$/m)?.[1]?.trim();
if (!KEY) throw new Error("MESHY_API_KEY missing in .env.local");
const API = "https://api.meshy.ai/openapi";
const RUN_ANIMS = [16, 13, 516, 366, 0]; // RunFast, Jump_Run, slide_light, falling_down, Idle
const IMG = "/home/alexleap/SqueaksBuilder/images/";

const JOBS = {
  // playable skins: image -> game-size textured mesh -> rig -> animations
  "skin_chef": { kind: "skin", image: IMG + "Chef_Mouse_Kitchen_Transformation.jpg" },
  "skin_racer": { kind: "skin", image: IMG + "Mouse_Racer_Briefcase.jpg" },
  // props: text -> low-poly textured mesh
  "cheese": { kind: "prop", poly: 2500, prompt: "a single chunky wedge of yellow swiss cheese with round holes, stylized cartoon game collectible, smooth clean shapes, glossy" },
  "pod": { kind: "prop", poly: 6000, prompt: "a futuristic rounded cargo pod vehicle on rails, long capsule shape, teal and white panels with glowing cyan light strips, round headlights at the front, stylized cartoon game asset" },
  // in-run boosters (gaming style)
  "hoverboard": { kind: "prop", dir: "boost", poly: 3500, prompt: "a futuristic hoverboard with no wheels, sleek rounded deck, glowing cyan underside thrusters and orange neon trim, stylized cartoon video game item" },
  "magnet": { kind: "prop", dir: "boost", poly: 2000, prompt: "a chunky red and silver horseshoe magnet power-up with a glossy finish, stylized cartoon video game pickup" },
  "star2x": { kind: "prop", dir: "boost", poly: 2000, prompt: "a chunky golden five-pointed star power-up with a big raised 2x on the front, glossy, stylized cartoon video game pickup" },
  // city decoration (placed along the street and on rooftops)
  "water_tank": { kind: "prop", dir: "decor", poly: 3000, prompt: "a rooftop wooden water tower tank on four metal legs with a conical roof, stylized cartoon city game asset, warm wood and dark metal" },
  "kiosk": { kind: "prop", dir: "decor", poly: 4000, prompt: "a small street snack kiosk booth with an orange striped awning, glowing menu board and a serving window, stylized cartoon city game asset" },
  "vending": { kind: "prop", dir: "decor", poly: 3000, prompt: "a cheese vending machine with a glowing front panel showing cheese wedges, yellow and navy body, stylized cartoon city game asset" },
  "crates": { kind: "prop", dir: "decor", poly: 2500, prompt: "a stack of three wooden cargo crates with metal corners, stylized cartoon game asset" },
  "hydrant": { kind: "prop", dir: "decor", poly: 2000, prompt: "a chunky red fire hydrant, stylized cartoon city street game asset, glossy" },
  "barrier": { kind: "prop", poly: 2500, prompt: "a low striped road barrier, yellow and dark navy diagonal stripes on a wide plank with two short metal legs, stylized cartoon game obstacle" },
};

async function api(method, path, body) {
  const r = await fetch(API + path, { method, headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  if (!r.ok) throw new Error(`${method} ${path}: ${r.status} ${t.slice(0, 300)}`);
  return JSON.parse(t);
}
async function task(path, body, label) {
  const id = (await api("POST", path, body)).result;
  for (;;) {
    await new Promise((s) => setTimeout(s, 8000));
    const t = await api("GET", `${path}/${id}`);
    if (["SUCCEEDED", "FAILED", "CANCELED"].includes(t.status)) {
      console.log(`  ${label}: ${t.status} (${t.consumed_credits ?? 0} credits)${t.task_error?.message ? " " + t.task_error.message : ""}`);
      if (t.status !== "SUCCEEDED") throw new Error(`${label} ${t.status}`);
      return t;
    }
  }
}
async function save(url, out) {
  mkdirSync(dirname(out), { recursive: true });
  const raw = out + ".raw.glb";
  const r = await fetch(url, { signal: AbortSignal.timeout(180000) });
  writeFileSync(raw, Buffer.from(await r.arrayBuffer()));
  console.log("  " + execFileSync("python3", ["-I", "scripts/shrink-glb.py", raw, out]).toString().trim());
  execFileSync("rm", ["-f", raw]);
}

async function skin(name, j) {
  const dataUri = "data:image/jpeg;base64," + readFileSync(j.image).toString("base64");
  const gen = await task("/v1/image-to-3d", { image_url: dataUri, should_remesh: true, topology: "triangle", target_polycount: 15000, should_texture: true, enable_pbr: false }, "image-to-3d");
  const rig = await task("/v1/rigging", { input_task_id: gen.id, height_meters: 1.2 }, "rig");
  const anim = await task("/v1/animations", { rig_task_id: rig.id, action_ids: RUN_ANIMS }, "animate");
  await save(anim.result.animation_glb_url, `public/models/skins/${name}.glb`);
}
async function prop(name, j) {
  const pre = await task("/v2/text-to-3d", { mode: "preview", prompt: j.prompt, should_remesh: true, topology: "triangle", target_polycount: j.poly }, "preview");
  const ref = await task("/v2/text-to-3d", { mode: "refine", preview_task_id: pre.id, texture_resolution: "2k" }, "refine");
  await save(ref.model_urls.glb, `public/models/${j.dir ?? "props"}/${name}.glb`);
}

const names = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(JOBS);
const before = (await api("GET", "/v1/balance")).balance;
console.log(`Balance before: ${before}`);
await Promise.all(names.map(async (n) => {
  const j = JOBS[n];
  try { console.log(`> ${n}`); await (j.kind === "skin" ? skin(n, j) : prop(n, j)); console.log(`✓ ${n}`); }
  catch (e) { console.log(`✗ ${n}: ${e.message}`); }
}));
const after = (await api("GET", "/v1/balance")).balance;
console.log(`Balance after: ${after} (used ${before - after})`);
