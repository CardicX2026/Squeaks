/**
 * Cheese Chase 3D engine (Three.js). Original "Cheese City" setting:
 * three glowing rail lanes, neon towers, cargo pods, barriers and laser gates.
 *
 * Swap the mouse by replacing /public/models/mouse.glb. Everything else is
 * built in code; each piece can later be replaced by a model the same way.
 */
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

export type Action = "l" | "r" | "j" | "s";
export type RunOpts = { trail: string; magnet: boolean; double: boolean; head: boolean };
type Kind = "c" | "low" | "high" | "pod";
type Obj = { k: Kind; l: number; m: THREE.Object3D; len: number; y: number; hit?: boolean; ht?: number; vz?: number };

export const MOUSE_URL = "/models/mouse.glb";
const CAR = 9.5, CAR_GAP = 0.6, WALL = 12;
const LANE = 2.2, SPAWN_Z = -140, MOUSE_H = 1.75, BOARD_TOP = 0.34, TRACK_LEN = 420;
const lx = (l: number) => (l - 1) * LANE;
const rnd = (a: number, b: number) => a + Math.random() * (b - a);

/* ---------- model loading (cached, shared across mounts) ---------- */
export type MouseAsset = { scene: THREE.Object3D; animations: THREE.AnimationClip[] };
const mouseCache = new Map<string, Promise<MouseAsset | null>>();
let progressCb: ((p: number) => void) | undefined;
export function preloadMouse(onProgress?: (p: number) => void, url = MOUSE_URL) {
  progressCb = onProgress;
  let mousePromise = mouseCache.get(url);
  if (!mousePromise) {
    mousePromise = new Promise((res) => {
      const loader = new GLTFLoader();
      loader.setMeshoptDecoder(MeshoptDecoder);
      loader.load(url, async (g) => {
        if (url !== MOUSE_URL) return res({ scene: g.scene, animations: g.animations });
        // Optional per-animation files (same rig): /models/anim/run.glb, jump.glb, slide.glb, fall.glb, idle.glb
        const extra = await Promise.all(["run", "jump", "slide", "fall", "idle"].map(async (k) => {
          try {
            const clip = (await loader.loadAsync(`/models/anim/${k}.glb`)).animations[0];
            if (clip) clip.name = k;
            return clip ?? null;
          } catch { return null; }
        }));
        const named = extra.filter((c): c is THREE.AnimationClip => !!c);
        res({ scene: g.scene, animations: named.length ? named : g.animations });
      }, (e) => { if (e.total) progressCb?.(e.loaded / e.total); }, (err) => { console.warn(`[cheese-chase] could not load ${url}`, err); if (url !== MOUSE_URL) preloadMouse(onProgress).then(res); else res(null); });
    });
    mouseCache.set(url, mousePromise);
  }
  return mousePromise;
}

/** Does a model file exist? (Next serves an HTML 404 page otherwise.) */
export async function hasModel(url: string) {
  try {
    const r = await fetch(url, { method: "HEAD" });
    return r.ok && (r.headers.get("content-type") ?? "").includes("model");
  } catch { return false; }
}

export type Props = Partial<Record<"cheese" | "pod" | "barrier", THREE.Object3D>>;
let propsPromise: Promise<Props> | null = null;
/** Optional Meshy prop models in /models/props. Each is normalised to game size; missing ones fall back to code-built shapes. */
export function preloadProps() {
  if (!propsPromise) propsPromise = (async () => {
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    const out: Props = {};
    const fit: Record<string, (o: THREE.Object3D, size: THREE.Vector3) => void> = {
      cheese: (o, sz) => { o.scale.multiplyScalar(0.8 / Math.max(sz.x, sz.y, sz.z)); },
      barrier: (o, sz) => { o.scale.multiplyScalar(1.9 / Math.max(sz.x, sz.z)); },
      pod: (o, sz) => { o.scale.multiplyScalar(1.95 / Math.min(sz.x, sz.z)); },
    };
    await Promise.all((["cheese", "pod", "barrier"] as const).map(async (k) => {
      const url = `/models/props/${k}.glb`;
      try {
        const g = await loader.loadAsync(url);
        const o = g.scene;
        let box = new THREE.Box3().setFromObject(o), sz = box.getSize(new THREE.Vector3());
        // long axis along the track (z)
        if ((k === "pod" || k === "barrier") && (k === "pod" ? sz.x > sz.z : sz.z > sz.x)) { o.rotation.y = Math.PI / 2; box = new THREE.Box3().setFromObject(o); sz = box.getSize(new THREE.Vector3()); }
        fit[k](o, sz);
        box = new THREE.Box3().setFromObject(o);
        const c = box.getCenter(new THREE.Vector3());
        o.position.x -= c.x; o.position.z -= c.z;
        o.position.y -= k === "cheese" ? c.y : box.min.y; // cheese centred, others stand on the ground
        const wrap = new THREE.Group();
        wrap.add(o);
        wrap.userData.len = box.getSize(new THREE.Vector3()).z;
        out[k] = wrap;
      } catch { /* keep the fallback shape */ }
    }));
    return out;
  })();
  return propsPromise;
}

export type Decor = Partial<Record<"water_tank" | "kiosk" | "vending" | "crates" | "hydrant", THREE.Object3D>>;
const DECOR_H = { water_tank: 3.2, kiosk: 2.6, vending: 2.1, crates: 1.5, hydrant: 0.9 } as const;
let decorPromise: Promise<Decor> | null = null;
/** Optional Meshy city props in /models/decor, scaled to game height and standing on the ground. */
export function preloadDecor() {
  if (!decorPromise) decorPromise = (async () => {
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    const out: Decor = {};
    await Promise.all((Object.keys(DECOR_H) as (keyof typeof DECOR_H)[]).map(async (k) => {
      try {
        const o = (await loader.loadAsync(`/models/decor/${k}.glb`)).scene;
        let box = new THREE.Box3().setFromObject(o);
        o.scale.multiplyScalar(DECOR_H[k] / box.getSize(new THREE.Vector3()).y);
        box = new THREE.Box3().setFromObject(o);
        const c = box.getCenter(new THREE.Vector3());
        o.position.set(-c.x, -box.min.y, -c.z);
        const wrap = new THREE.Group(); wrap.add(o);
        out[k] = wrap;
      } catch { /* optional */ }
    }));
    return out;
  })();
  return decorPromise;
}

/* ---------- textures drawn in code ---------- */
function canvasTex(w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  draw(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
const WINDOW_TINTS = [["#ffd27a", "#ffb35c"], ["#8fd3ff", "#5fa8ff"], ["#ff9ad5", "#c58bff"], ["#9dffcf", "#ffd27a"]];
function windowTex(i: number) {
  const t = canvasTex(128, 256, (c) => {
    c.fillStyle = "#0b0e2c"; c.fillRect(0, 0, 128, 256);
    for (let y = 0; y < 8; y++) for (let x = 0; x < 4; x++) {
      const lit = Math.random() < 0.55;
      c.fillStyle = lit ? WINDOW_TINTS[i][Math.random() < 0.7 ? 0 : 1] : "#161b46";
      c.fillRect(10 + x * 30, 10 + y * 31, 18, 20);
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
/** Original trackside murals: colour blocks, cheese wedges, stars and SQKS tags. */
function muralTex(v: number) {
  const pal = [["#2b3a8f", "#f28c3f", "#ffc83d", "#7ed9bc"], ["#5a2a7a", "#f5a3a7", "#ffc83d", "#7393cc"], ["#1f5f66", "#ffc83d", "#f28c3f", "#fff7ee"], ["#3a2f5c", "#7ed9bc", "#f5a3a7", "#ffc83d"]][v % 4];
  const t = canvasTex(512, 64, (c) => {
    c.fillStyle = pal[0]; c.fillRect(0, 0, 512, 64);
    for (let i = 0; i < 7; i++) { c.fillStyle = pal[1 + (i % 3)]; c.globalAlpha = 0.35; c.beginPath(); c.arc(Math.random() * 512, Math.random() * 64, 14 + Math.random() * 30, 0, 7); c.fill(); }
    c.globalAlpha = 1;
    for (let i = 0; i < 4; i++) {
      const x = 40 + i * 120 + Math.random() * 30, y = 18 + Math.random() * 20;
      c.fillStyle = pal[2]; c.beginPath(); c.moveTo(x, y + 20); c.lineTo(x + 34, y + 20); c.lineTo(x + 34, y + 4); c.lineTo(x + 10, y - 4); c.closePath(); c.fill();
      c.fillStyle = "rgba(0,0,0,.25)"; c.beginPath(); c.arc(x + 22, y + 11, 3.5, 0, 7); c.arc(x + 12, y + 15, 2.5, 0, 7); c.fill();
    }
    c.font = "bold 30px system-ui, sans-serif"; c.lineWidth = 6; c.strokeStyle = "#141833"; c.fillStyle = pal[1];
    const tx = 120 + (v * 73) % 260;
    c.strokeText(v % 2 ? "SQKS" : "CHEESE", tx, 46); c.fillText(v % 2 ? "SQKS" : "CHEESE", tx, 46);
    c.fillStyle = "rgba(0,0,0,.35)"; c.fillRect(0, 56, 512, 8);
  });
  t.wrapS = THREE.RepeatWrapping;
  return t;
}

/** Train side livery (original "SQKS Line" design): windows, doors, stripe and logo. */
function liveryTex(body: string, accent: string) {
  return canvasTex(1024, 224, (c) => {
    c.fillStyle = body; c.fillRect(0, 0, 1024, 224);
    c.fillStyle = "rgba(255,255,255,.18)"; c.fillRect(0, 0, 1024, 10);
    c.fillStyle = accent; c.fillRect(0, 150, 1024, 22);
    c.fillStyle = "#11152e"; c.fillRect(0, 172, 1024, 6);
    const door = (x: number) => { c.fillStyle = "#1b2140"; c.fillRect(x, 40, 92, 176); c.fillStyle = "#0b0f22"; c.fillRect(x + 8, 50, 34, 80); c.fillRect(x + 50, 50, 34, 80); c.fillStyle = "rgba(255,230,170,.35)"; c.fillRect(x + 10, 52, 30, 30); c.fillRect(x + 52, 52, 30, 30); c.fillStyle = accent; c.fillRect(x + 44, 40, 4, 176); };
    for (let i = 0; i < 9; i++) {
      const x = 20 + i * 112;
      if (i === 2 || i === 6) { door(x); continue; }
      c.fillStyle = "#0b0f22"; c.beginPath(); c.roundRect(x, 46, 90, 78, 10); c.fill();
      c.fillStyle = "rgba(255,225,160,.28)"; c.beginPath(); c.roundRect(x + 4, 50, 82, 30, 8); c.fill();
      c.fillStyle = "rgba(255,255,255,.18)"; c.fillRect(x + 10, 54, 20, 60);
    }
    c.font = "bold 34px system-ui, sans-serif"; c.fillStyle = "#11152e"; c.fillText("SQKS LINE", 760, 205);
  });
}
function trainFrontTex(accent: string) {
  return canvasTex(256, 320, (c) => {
    c.fillStyle = "#1a1f3d"; c.beginPath(); c.roundRect(0, 0, 256, 320, 30); c.fill();
    c.fillStyle = "#0a0d1f"; c.beginPath(); c.roundRect(22, 40, 212, 130, 20); c.fill();
    c.fillStyle = "rgba(160,200,255,.22)"; c.beginPath(); c.moveTo(40, 160); c.lineTo(110, 50); c.lineTo(140, 50); c.lineTo(70, 160); c.fill();
    c.fillStyle = "#ff9a3c"; c.font = "bold 22px system-ui, sans-serif"; c.textAlign = "center"; c.fillText("CHEESE CITY", 128, 28);
    c.fillStyle = accent; c.fillRect(0, 196, 256, 26);
    c.fillStyle = "#2a3050"; for (let i = 0; i < 5; i++) c.fillRect(70 + i * 24, 250, 14, 44);
  });
}

function signTex(text: string, color: string) {
  return canvasTex(512, 192, (c) => {
    c.fillStyle = "rgba(8,10,30,.85)"; c.beginPath(); c.roundRect(8, 8, 496, 176, 40); c.fill();
    c.strokeStyle = color; c.lineWidth = 10; c.shadowColor = color; c.shadowBlur = 24; c.stroke();
    c.font = "bold 92px system-ui, sans-serif"; c.textAlign = "center"; c.textBaseline = "middle";
    c.fillStyle = color; c.fillText(text, 256, 100);
  });
}

/* ---------- the engine ---------- */
export class Runner3D {
  private el: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private composer: EffectComposer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(62, 1, 0.1, 900);
  private ro: ResizeObserver;
  private raf = 0;
  private last = performance.now();
  private mode: "idle" | "run" | "dying" | "over" = "idle";
  paused = false;
  private onHud: (score: number, cheese: number) => void;
  private onEnd: (score: number, cheese: number) => void;

  // world
  private trackTex!: THREE.Texture;
  private buildings: { g: THREE.Group; d: number; side: number }[] = [];
  private farZ: Record<number, number> = { [-1]: 0, [1]: 0 };
  private lamps: THREE.Group[] = [];
  private sleepers!: THREE.Group;
  private walls: THREE.Group[] = [];
  private bridges: THREE.Group[] = [];
  private dist = 0;
  private busy = [0, 0, 0];
  private trainMats: { side: THREE.Material; front: THREE.Material; body: THREE.Material }[] = [];
  private onPickup?: (x: number, y: number) => void;
  private street: THREE.Object3D[] = [];
  /** Place city props: water towers on some rooftops, shops and street furniture along both sidewalks. */
  setDecor(d: Decor) {
    if (d.water_tank) for (const b of this.buildings) {
      if (Math.random() > 0.45) continue;
      const { w, h, d: dep } = b.g.userData as { w: number; h: number; d: number };
      const t = d.water_tank.clone();
      t.position.set(rnd(-w / 2 + 1.4, w / 2 - 1.4), h, rnd(-dep / 2 + 1.4, dep / 2 - 1.4));
      t.rotation.y = rnd(0, Math.PI);
      b.g.add(t);
    }
    const kinds = (["kiosk", "vending", "crates", "hydrant"] as const).filter((k) => d[k]);
    if (!kinds.length) return;
    for (const side of [-1, 1]) for (let i = 0; i < 16; i++) {
      const k = kinds[(i * 3 + (side > 0 ? 1 : 0)) % kinds.length];
      const o = d[k]!.clone();
      o.position.set(side * (k === "hydrant" ? 5.1 : 6.25), 0, 14 - i * 15 + rnd(-3, 3));
      o.rotation.y = -side * Math.PI / 2 + (k === "crates" ? rnd(-0.4, 0.4) : 0);
      this.scene.add(o);
      this.street.push(o);
    }
  }
  private objs: Obj[] = [];
  private geo: Record<string, THREE.BufferGeometry> = {};
  private mat: Record<string, THREE.Material> = {};

  // player
  private rig = new THREE.Group();
  private holder = new THREE.Group();
  private board = new THREE.Group();
  private props: Props = {};
  setProps(p: Props) { this.props = p; }
  private mixer: THREE.AnimationMixer | null = null;
  private anims: Partial<Record<"run" | "jump" | "slide" | "die" | "idle", THREE.AnimationAction>> = {};
  private curAnim = "";
  private shadow!: THREE.Mesh;
  private trail!: THREE.Mesh;
  private trailLight!: THREE.PointLight;

  // state
  private lane = 1; private px = 0; private py = 0; private vy = 0; private slide = 0;
  private speed = 8; private t = 0; private next = 0; private score = 0; private cheese = 0;
  private dieT = 0; private opts: RunOpts = { trail: "", magnet: false, double: false, head: false };

  constructor(el: HTMLElement, cb: { onHud: (s: number, c: number) => void; onEnd: (s: number, c: number) => void; onPickup?: (x: number, y: number) => void }) {
    this.el = el;
    this.onHud = cb.onHud; this.onEnd = cb.onEnd; this.onPickup = cb.onPickup;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    const cv = this.renderer.domElement;
    cv.style.width = "100%"; cv.style.height = "100%"; cv.style.display = "block";
    el.prepend(cv);

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.composer.addPass(new UnrealBloomPass(new THREE.Vector2(256, 256), 0.55, 0.4, 0.88));
    this.composer.addPass(new OutputPass());

    this.buildWorld();
    this.buildPlayer();
    this.setMouse(null);

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(el);
    this.resize();
    this.raf = requestAnimationFrame(this.frame);
  }

  /* ----- public API ----- */
  setMouse(model: MouseAsset | null) {
    this.holder.clear();
    this.mixer = null; this.anims = {}; this.curAnim = ""; this.board.visible = true;
    if (!model) { this.holder.add(this.placeholderMouse()); return; }
    const m = SkeletonUtils.clone(model.scene);
    m.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const mt of mats) {
        const s = mt as THREE.MeshStandardMaterial;
        if (s.isMeshStandardMaterial && s.metalness > 0.4) s.metalness = 0.25; // no env map, so tame metal
      }
    });
    // precise = follow the skeleton, so rigs that store their scale in the armature size correctly
    m.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(m, true);
    const size = box.getSize(new THREE.Vector3());
    m.scale.multiplyScalar(MOUSE_H / size.y);
    m.updateMatrixWorld(true);
    box.setFromObject(m, true);
    const c = box.getCenter(new THREE.Vector3());
    m.position.x -= c.x; m.position.z -= c.z; m.position.y += BOARD_TOP - box.min.y;
    m.rotation.y = Math.PI; // face down the track, back to the camera
    this.holder.add(m);
    // Animations: matched by keywords in the clip name, so any Meshy/Mixamo export works.
    if (model.animations.length) {
      this.mixer = new THREE.AnimationMixer(m);
      const find: Record<string, RegExp> = { run: /^(?!.*jump).*(run|jog|skate|sprint|walk)/i, jump: /jump|hop|leap/i, slide: /slide|crouch|roll|duck/i, die: /fall|death|die|hit|knock/i, idle: /idle|dance|stand|breath/i };
      for (const [k, re] of Object.entries(find)) {
        const clip = model.animations.find((c) => re.test(c.name));
        if (!clip) continue;
        const a = this.mixer.clipAction(clip);
        if (k === "jump" || k === "die") { a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; }
        this.anims[k as keyof typeof this.anims] = a;
      }
      if (!this.anims.run) this.anims.run = this.mixer.clipAction(model.animations[0]);
    }
    // An animated mouse runs on its own feet: drop the skateboard.
    this.board.visible = !this.mixer;
    if (this.mixer) m.position.y -= BOARD_TOP;
  }

  start(opts: RunOpts) {
    for (const o of this.objs) this.scene.remove(o.m);
    this.objs = [];
    this.opts = opts;
    this.lane = 1; this.px = 0; this.py = 0; this.vy = 0; this.slide = 0;
    this.dist = 0; this.busy = [0, 0, 0];
    this.speed = 22; this.t = 0; this.next = 30; this.cheese = 0; this.score = opts.head ? 500 : 0;
    this.setTrail(opts.trail);
    this.mode = "run";
  }

  stop() {
    for (const o of this.objs) this.scene.remove(o.m);
    this.objs = [];
    this.lane = 1; this.py = 0; this.vy = 0; this.slide = 0;
    this.mode = "idle";
  }

  act(a: Action) {
    if (this.mode !== "run") return;
    if (a === "l") this.lane = Math.max(0, this.lane - 1);
    if (a === "r") this.lane = Math.min(2, this.lane + 1);
    if (a === "j" && this.py < 0.05) { this.vy = 11.5; this.slide = 0; }
    if (a === "s") { this.slide = 0.65; if (this.py > 0.05) this.vy = -20; }
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    this.ro.disconnect();
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose?.();
      const mats = m.material ? (Array.isArray(m.material) ? m.material : [m.material]) : [];
      mats.forEach((x) => { (x as THREE.MeshStandardMaterial).map?.dispose(); (x as THREE.MeshStandardMaterial).emissiveMap?.dispose(); x.dispose(); });
    });
    this.composer.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  /* ----- setup ----- */
  private resize() {
    const w = this.el.clientWidth || 1, h = this.el.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.composer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.fov = w / h < 0.75 ? 68 : 56;
    this.camera.updateProjectionMatrix();
  }

  private buildWorld() {
    const s = this.scene;
    s.fog = new THREE.Fog(0x1b1250, 45, 170);
    s.add(new THREE.HemisphereLight(0x9aa8ff, 0x2a1440, 1.4));
    const sun = new THREE.DirectionalLight(0xffe2b8, 2.2);
    sun.position.set(4, 10, 9);
    s.add(sun);
    const rim = new THREE.DirectionalLight(0xff7ad9, 1.2);
    rim.position.set(-6, 4, -10);
    s.add(rim);

    // sky dome with a gradient
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(600, 32, 16),
      new THREE.ShaderMaterial({
        side: THREE.BackSide, depthWrite: false, fog: false,
        uniforms: { top: { value: new THREE.Color(0x050718) }, mid: { value: new THREE.Color(0x1a1a5c) }, bot: { value: new THREE.Color(0x6a2c94) } },
        vertexShader: "varying float vY; void main(){ vY = normalize(position).y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
        fragmentShader: "uniform vec3 top; uniform vec3 mid; uniform vec3 bot; varying float vY; void main(){ vec3 c = vY > 0.12 ? mix(mid, top, smoothstep(0.12, 0.6, vY)) : mix(bot, mid, smoothstep(-0.05, 0.12, vY)); gl_FragColor = vec4(c, 1.0); }",
      }),
    );
    s.add(sky);

    // stars
    const sp: number[] = [];
    for (let i = 0; i < 700; i++) {
      const th = Math.random() * Math.PI * 2, ph = rnd(0.12, 1.4);
      sp.push(Math.cos(th) * Math.cos(ph) * 500, Math.sin(ph) * 500, Math.sin(th) * Math.cos(ph) * 500);
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute("position", new THREE.Float32BufferAttribute(sp, 3));
    s.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, fog: false })));

    // the cheese moon
    const moon = new THREE.Mesh(
      new THREE.SphereGeometry(22, 32, 16),
      new THREE.MeshBasicMaterial({
        fog: false, toneMapped: false,
        map: canvasTex(256, 128, (c) => {
          c.fillStyle = "#ffe27a"; c.fillRect(0, 0, 256, 128);
          c.fillStyle = "#e9b53c";
          for (let i = 0; i < 26; i++) { c.beginPath(); c.arc(Math.random() * 256, Math.random() * 128, rnd(3, 11), 0, 7); c.fill(); }
        }),
      }),
    );
    moon.position.set(90, 120, -420);
    s.add(moon);

    // far skyline silhouettes
    const skyMat = new THREE.MeshBasicMaterial({ color: 0x0d0b33, fog: false });
    for (let x = -260; x < 260; x += rnd(10, 18)) {
      const h = rnd(25, 95);
      const b = new THREE.Mesh(new THREE.BoxGeometry(rnd(10, 18), h, 10), skyMat);
      b.position.set(x, h / 2 - 2, -380);
      s.add(b);
    }

    // ---------- ground, ballast, sleepers, steel rails ----------
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(220, TRACK_LEN), new THREE.MeshStandardMaterial({ color: 0x14173a, roughness: 0.95 }));
    ground.rotation.x = -Math.PI / 2; ground.position.set(0, -0.02, -TRACK_LEN / 2 + 20);
    s.add(ground);
    this.trackTex = canvasTex(256, 256, (c) => {
      c.fillStyle = "#1c1e30"; c.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 2200; i++) {
        const v = 26 + Math.random() * 38;
        c.fillStyle = `rgb(${v},${v + 4},${v + 18})`;
        c.beginPath(); c.arc(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 2.6, 0, 7); c.fill();
      }
    });
    this.trackTex.wrapS = this.trackTex.wrapT = THREE.RepeatWrapping;
    this.trackTex.repeat.set(3, TRACK_LEN / 4);
    const bed = new THREE.Mesh(new THREE.PlaneGeometry(LANE * 3 + 1.6, TRACK_LEN), new THREE.MeshStandardMaterial({ map: this.trackTex, roughness: 1 }));
    bed.rotation.x = -Math.PI / 2; bed.position.set(0, 0.005, -TRACK_LEN / 2 + 20);
    s.add(bed);
    // sleepers: one instanced mesh that shifts by (distance mod spacing) each frame
    const SL = 1.2, NS = 200;
    const sleeperMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1.75, 0.1, 0.3), new THREE.MeshStandardMaterial({ color: 0x5b6176, roughness: 0.85 }), NS * 3);
    const mtx = new THREE.Matrix4();
    for (let l = 0; l < 3; l++) for (let i = 0; i < NS; i++) { mtx.makeTranslation(lx(l), 0.05, 20 - i * SL); sleeperMesh.setMatrixAt(l * NS + i, mtx); }
    this.sleepers = new THREE.Group();
    this.sleepers.add(sleeperMesh);
    s.add(this.sleepers);
    // rails: foot, web and polished head (standard rail profile, scaled to the game)
    const steel = new THREE.MeshStandardMaterial({ color: 0x8b93a8, metalness: 0.85, roughness: 0.32 });
    const shine = new THREE.MeshBasicMaterial({ color: new THREE.Color(0x9aa6c4).multiplyScalar(0.55) });
    const foot = new THREE.BoxGeometry(0.16, 0.03, TRACK_LEN), web = new THREE.BoxGeometry(0.045, 0.09, TRACK_LEN), head = new THREE.BoxGeometry(0.1, 0.065, TRACK_LEN), gleam = new THREE.BoxGeometry(0.05, 0.004, TRACK_LEN);
    for (let l = 0; l < 3; l++) for (const o of [-0.55, 0.55]) {
      const zc = -TRACK_LEN / 2 + 20, x = lx(l) + o;
      const a = new THREE.Mesh(foot, steel); a.position.set(x, 0.115, zc);
      const b = new THREE.Mesh(web, steel); b.position.set(x, 0.175, zc);
      const c2 = new THREE.Mesh(head, steel); c2.position.set(x, 0.252, zc);
      const d = new THREE.Mesh(gleam, shine); d.position.set(x, 0.287, zc);
      s.add(a, b, c2, d);
    }

    // ---------- trackside walls with original murals ----------
    const murals = [0, 1, 2, 3, 4, 5].map((v) => muralTex(v));
    const wallGeo = new THREE.BoxGeometry(0.4, 1.1, WALL);
    const capGeo = new THREE.BoxGeometry(0.55, 0.12, WALL);
    const capMat = new THREE.MeshStandardMaterial({ color: 0x8e95ad, roughness: 0.7 });
    for (const side of [-1, 1]) for (let i = 0; i < 22; i++) {
      const g = new THREE.Group();
      const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: murals[(i * 7 + (side + 1)) % murals.length], roughness: 0.8 });
      const w = new THREE.Mesh(wallGeo, [mat, mat, capMat, capMat, capMat, capMat]);
      w.position.y = 0.55;
      const cap = new THREE.Mesh(capGeo, capMat); cap.position.y = 1.16;
      g.add(w, cap);
      g.position.set(side * (LANE * 1.5 + 1.05), 0, 20 - WALL / 2 - i * WALL);
      s.add(g);
      this.walls.push(g);
    }

    // ---------- overhead bridges for scale ----------
    for (let i = 0; i < 2; i++) {
      const g = new THREE.Group();
      const concrete = new THREE.MeshStandardMaterial({ color: 0x3a3f63, roughness: 0.8 });
      const deck = new THREE.Mesh(new THREE.BoxGeometry(15, 0.9, 3.2), concrete); deck.position.y = 7.2;
      g.add(deck);
      for (const x of [-5.4, 5.4]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.9, 7, 0.9), concrete); p.position.set(x, 3.5, 0); g.add(p); }
      const neonBar = new THREE.Mesh(new THREE.BoxGeometry(15, 0.1, 0.1), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xf28c3f).multiplyScalar(2.2), toneMapped: false }));
      neonBar.position.set(0, 6.72, 1.62); g.add(neonBar);
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 0.8), new THREE.MeshBasicMaterial({ map: signTex("SQKS LINE", "#ffc83d"), transparent: true, toneMapped: false }));
      sign.position.set(0, 7.2, 1.62); g.add(sign);
      const rail = new THREE.Mesh(new THREE.BoxGeometry(15, 0.5, 0.08), concrete); rail.position.set(0, 7.9, 1.55); g.add(rail);
      g.position.z = -90 - i * 110;
      s.add(g);
      this.bridges.push(g);
    }

    // buildings with lit windows, neon roof lines and signs
    const winTex = [0, 1, 2, 3].map(windowTex);
    const signs = [["SQUEAKS", "#ffd23f"], ["CHEESE", "#ff6ad5"], ["24H MART", "#5fe3ff"], ["CHEESE CITY", "#9dffcf"], ["RAT RADIO", "#ff9a4d"]];
    const box = new THREE.BoxGeometry(1, 1, 1);
    for (const side of [-1, 1]) {
      let z = 16;
      while (z > -175) {
        const w = rnd(6, 11), d = rnd(8, 15), h = rnd(9, 30), ti = Math.floor(Math.random() * 4);
        const g = new THREE.Group();
        const tex = winTex[ti].clone();
        tex.needsUpdate = true;
        tex.repeat.set(Math.max(1, Math.round(d / 4)), Math.max(1, Math.round(h / 5)));
        const body = new THREE.Mesh(box, new THREE.MeshStandardMaterial({ color: 0x1a1f48, map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.9, roughness: 0.8 }));
        body.scale.set(w, h, d); body.position.y = h / 2;
        g.add(body);
        const neonCol = new THREE.Color(WINDOW_TINTS[ti][1]);
        const neon = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, d), new THREE.MeshBasicMaterial({ color: neonCol.multiplyScalar(2.2), toneMapped: false }));
        neon.position.set(-side * w / 2, h, 0);
        g.add(neon);
        if (Math.random() < 0.4 && h > 11) {
          const [txt, col] = signs[Math.floor(Math.random() * signs.length)];
          const sign = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 1.6), new THREE.MeshBasicMaterial({ map: signTex(txt, col), transparent: true, toneMapped: false }));
          sign.position.set(-side * (w / 2 + 0.05), rnd(6, h - 3), 0);
          sign.rotation.y = -side * Math.PI / 2;
          g.add(sign);
        }
        g.userData = { w, h, d };
        g.position.set(side * (7 + w / 2), 0, z - d / 2);
        this.scene.add(g);
        this.buildings.push({ g, d, side });
        z -= d + rnd(0.6, 2.4);
      }
      this.farZ[side] = z;
    }

    // street lamps
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x232a5c, roughness: 0.6 });
    const headMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffd27a).multiplyScalar(2.4), toneMapped: false });
    for (const side of [-1, 1]) for (let i = 0; i < 14; i++) {
      const g = new THREE.Group();
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 4.4, 8), poleMat);
      pole.position.y = 2.2;
      const arm = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.08, 0.08), poleMat);
      arm.position.set(-side * 0.5, 4.35, 0);
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.26), headMat);
      head.position.set(-side * 0.95, 4.28, 0);
      g.add(pole, arm, head);
      g.position.set(side * 5.6, 0, 14 - i * 12);
      this.scene.add(g);
      this.lamps.push(g);
    }

    // shared geometry / materials for spawned objects
    const wedge = new THREE.Shape();
    wedge.moveTo(-0.38, -0.22); wedge.lineTo(0.38, -0.22); wedge.lineTo(0.38, 0.14); wedge.lineTo(0.05, 0.3); wedge.closePath();
    const cheeseGeo = new THREE.ExtrudeGeometry(wedge, { depth: 0.3, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 2 });
    cheeseGeo.center();
    this.geo.cheese = cheeseGeo;
    this.mat.cheese = new THREE.MeshStandardMaterial({ color: 0xffd23f, emissive: 0xffb400, emissiveIntensity: 0.55, roughness: 0.45 });
    this.mat.stripe = new THREE.MeshStandardMaterial({
      map: canvasTex(256, 64, (c) => {
        c.fillStyle = "#ffc21a"; c.fillRect(0, 0, 256, 64);
        c.fillStyle = "#24160a";
        for (let i = -1; i < 9; i++) { c.beginPath(); c.moveTo(i * 32, 64); c.lineTo(i * 32 + 16, 64); c.lineTo(i * 32 + 40, 0); c.lineTo(i * 32 + 24, 0); c.fill(); }
      }),
      emissive: 0xffb400, emissiveIntensity: 0.25, roughness: 0.5,
    });
    this.mat.post = new THREE.MeshStandardMaterial({ color: 0x2a2f63, roughness: 0.5, metalness: 0.3 });
    this.mat.laser = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff3df0).multiplyScalar(3), toneMapped: false });
    this.mat.glass = new THREE.MeshStandardMaterial({ color: 0x0a0d24, roughness: 0.15, metalness: 0.4 });
    this.mat.light = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xfff2c0).multiplyScalar(3), toneMapped: false });
    this.geo.box = box;
    // sharper obstacles: chevron boards and train liveries
    const chevron = (a: string, b: string) => canvasTex(256, 64, (c) => {
      c.fillStyle = a; c.fillRect(0, 0, 256, 64); c.fillStyle = b;
      for (let i = -2; i < 10; i++) { c.beginPath(); c.moveTo(i * 32, 64); c.lineTo(i * 32 + 16, 64); c.lineTo(i * 32 + 48, 0); c.lineTo(i * 32 + 32, 0); c.fill(); }
      c.strokeStyle = "rgba(255,255,255,.55)"; c.lineWidth = 4; c.strokeRect(2, 2, 252, 60);
    });
    this.mat.jump = new THREE.MeshStandardMaterial({ map: chevron("#ffc21a", "#151933"), roughness: 0.35, metalness: 0.1 });
    this.mat.duck = new THREE.MeshStandardMaterial({ map: chevron("#f4f4f8", "#e5383b"), roughness: 0.35, metalness: 0.1 });
    this.mat.metal = new THREE.MeshStandardMaterial({ color: 0xb8bfd2, metalness: 0.8, roughness: 0.3 });
    this.mat.dark = new THREE.MeshStandardMaterial({ color: 0x1b2038, metalness: 0.5, roughness: 0.5 });
    this.mat.amber = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffa31a).multiplyScalar(2.5), toneMapped: false });
    this.mat.red = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff3b3b).multiplyScalar(2.5), toneMapped: false });
    this.geo.board = new RoundedBoxGeometry(2.0, 0.42, 0.12, 3, 0.04);
    this.geo.duck = new RoundedBoxGeometry(2.15, 0.5, 0.14, 3, 0.05);
    this.geo.carBody = new RoundedBoxGeometry(1.9, 2.3, CAR, 4, 0.22);
    this.geo.wheel = new THREE.CylinderGeometry(0.22, 0.22, 0.12, 18);
    this.geo.lampDot = new THREE.SphereGeometry(0.07, 12, 8);
    this.geo.head = new THREE.SphereGeometry(0.13, 16, 10);
    for (const [body, accent] of [["#f5b82e", "#11152e"], ["#2bb3a3", "#ffc83d"], ["#f28c3f", "#fff7ee"], ["#4f74b8", "#ffc83d"]]) {
      this.trainMats.push({
        side: new THREE.MeshStandardMaterial({ map: liveryTex(body, accent), roughness: 0.4, metalness: 0.2 }),
        front: new THREE.MeshStandardMaterial({ map: trainFrontTex(accent), roughness: 0.3, metalness: 0.2 }),
        body: new THREE.MeshStandardMaterial({ color: body, roughness: 0.4, metalness: 0.25 }),
      });
    }
  }

  /** Jump barrier: top edge at ~1.0 (jump peak is ~1.94). */
  private buildJump() {
    const g = new THREE.Group();
    const board = new THREE.Mesh(this.geo.board, this.mat.jump); board.position.y = 0.78; g.add(board);
    for (const x of [-0.82, 0.82]) {
      for (const dz of [-0.16, 0.16]) { const leg = new THREE.Mesh(this.geo.box, this.mat.metal); leg.scale.set(0.06, 0.82, 0.06); leg.position.set(x, 0.41, dz); leg.rotation.x = dz > 0 ? -0.18 : 0.18; g.add(leg); }
      const footM = new THREE.Mesh(this.geo.box, this.mat.dark); footM.scale.set(0.16, 0.05, 0.5); footM.position.set(x, 0.025, 0); g.add(footM);
    }
    const lamp = new THREE.Mesh(this.geo.lampDot, this.mat.amber); lamp.position.set(0, 1.06, 0); g.add(lamp);
    return g;
  }
  /** Duck gantry: board from 1.3 to 1.8 (sliding mouse is 1.1 tall). */
  private buildDuck() {
    const g = new THREE.Group();
    for (const x of [-1.05, 1.05]) {
      const post = new THREE.Mesh(this.geo.box, this.mat.metal); post.scale.set(0.12, 2.5, 0.12); post.position.set(x, 1.25, 0); g.add(post);
      const footM = new THREE.Mesh(this.geo.box, this.mat.dark); footM.scale.set(0.3, 0.06, 0.4); footM.position.set(x, 0.03, 0); g.add(footM);
      const l = new THREE.Mesh(this.geo.lampDot, this.mat.red); l.position.set(x, 2.56, 0); g.add(l);
    }
    const board = new THREE.Mesh(this.geo.duck, this.mat.duck); board.position.y = 1.55; g.add(board);
    const top = new THREE.Mesh(this.geo.box, this.mat.metal); top.scale.set(2.2, 0.08, 0.08); top.position.y = 2.45; g.add(top);
    return g;
  }
  /** A train of n cars (original SQKS Line design): 1.9 wide, ~2.7 tall, 9.5 long per car. */
  private buildTrain(n: number, moving: boolean) {
    const g = new THREE.Group();
    const lv = this.trainMats[Math.floor(Math.random() * this.trainMats.length)];
    const total = n * CAR + (n - 1) * CAR_GAP;
    for (let i = 0; i < n; i++) {
      const zc = total / 2 - CAR / 2 - i * (CAR + CAR_GAP);
      const body = new THREE.Mesh(this.geo.carBody, lv.body); body.position.set(0, 1.5, zc); g.add(body);
      for (const side of [-1, 1]) {
        const panel = new THREE.Mesh(new THREE.PlaneGeometry(CAR - 0.5, 2.0), lv.side);
        panel.position.set(side * 0.952, 1.45, zc); panel.rotation.y = side * Math.PI / 2; g.add(panel);
      }
      const under = new THREE.Mesh(this.geo.box, this.mat.dark); under.scale.set(1.6, 0.34, CAR - 1); under.position.set(0, 0.32, zc); g.add(under);
      for (const bz of [-CAR * 0.32, CAR * 0.32]) for (const wx of [-0.62, 0.62]) for (const wz of [-0.45, 0.45]) {
        const w = new THREE.Mesh(this.geo.wheel, this.mat.metal); w.rotation.z = Math.PI / 2; w.position.set(wx, 0.24, zc + bz + wz); g.add(w);
      }
      for (const az of [-CAR * 0.22, CAR * 0.22]) { const ac = new THREE.Mesh(this.geo.box, this.mat.metal); ac.scale.set(1.0, 0.16, 1.6); ac.position.set(0, 2.73, zc + az); g.add(ac); }
      if (i < n - 1) { const cp = new THREE.Mesh(this.geo.box, this.mat.dark); cp.scale.set(0.3, 0.25, CAR_GAP + 0.3); cp.position.set(0, 0.7, zc - CAR / 2 - CAR_GAP / 2); g.add(cp); }
    }
    const front = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 2.12), lv.front); front.position.set(0, 1.55, total / 2 + 0.012); g.add(front);
    for (const x of [-0.55, 0.55]) { const h = new THREE.Mesh(this.geo.head, moving ? this.mat.light : this.mat.amber); h.position.set(x, 0.85, total / 2 + 0.05); g.add(h); }
    g.userData.len = total;
    return g;
  }

  private buildPlayer() {
    const deck = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.08, 1.7), new THREE.MeshStandardMaterial({ color: 0x16d07a, roughness: 0.4, emissive: 0x0a6a3a, emissiveIntensity: 0.4 }));
    deck.position.y = 0.27;
    const wheelMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffd23f).multiplyScalar(1.8), toneMapped: false });
    const wheelGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.12, 16);
    this.board.add(deck);
    this.rig.add(this.board);
    for (const x of [-0.3, 0.3]) for (const z of [-0.58, 0.58]) {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.rotation.z = Math.PI / 2; w.position.set(x, 0.12, z);
      this.board.add(w);
    }
    this.rig.add(this.holder);
    this.scene.add(this.rig);

    this.shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.9, 24),
      new THREE.MeshBasicMaterial({
        transparent: true, depthWrite: false,
        map: canvasTex(64, 64, (c) => { const g = c.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, "rgba(0,0,0,.6)"); g.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = g; c.fillRect(0, 0, 64, 64); }),
      }),
    );
    this.shadow.rotation.x = -Math.PI / 2; this.shadow.position.y = 0.02;
    this.scene.add(this.shadow);

    this.trail = new THREE.Mesh(
      new THREE.PlaneGeometry(0.55, 5),
      new THREE.MeshBasicMaterial({
        transparent: true, depthWrite: false, toneMapped: false,
        alphaMap: canvasTex(8, 64, (c) => { const g = c.createLinearGradient(0, 0, 0, 64); g.addColorStop(0, "#fff"); g.addColorStop(1, "#000"); c.fillStyle = g; c.fillRect(0, 0, 8, 64); }),
      }),
    );
    this.trail.rotation.x = -Math.PI / 2; this.trail.position.set(0, 0.05, 3.1);
    this.trail.visible = false;
    this.rig.add(this.trail);
    this.trailLight = new THREE.PointLight(0xffffff, 0, 5);
    this.trailLight.position.set(0, 0.3, 0.6);
    this.rig.add(this.trailLight);
  }

  private setTrail(color: string) {
    this.trail.visible = !!color;
    this.trailLight.intensity = color ? 8 : 0;
    if (color) {
      (this.trail.material as THREE.MeshBasicMaterial).color = new THREE.Color(color).multiplyScalar(2);
      this.trailLight.color = new THREE.Color(color);
    }
  }

  private placeholderMouse() {
    const g = new THREE.Group();
    const fur = new THREE.MeshStandardMaterial({ color: 0xff8f3c, roughness: 0.7 });
    const pink = new THREE.MeshStandardMaterial({ color: 0xffb89a, roughness: 0.7 });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 0.5, 6, 12), new THREE.MeshStandardMaterial({ color: 0x1b1b24 }));
    body.position.y = BOARD_TOP + 0.6;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.38, 20, 14), fur);
    head.position.y = BOARD_TOP + 1.3;
    g.add(body, head);
    for (const x of [-0.32, 0.32]) {
      const ear = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.06, 20), fur);
      ear.rotation.x = Math.PI / 2; ear.position.set(x, BOARD_TOP + 1.68, 0);
      const inner = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.07, 20), pink);
      inner.rotation.x = Math.PI / 2; inner.position.set(x, BOARD_TOP + 1.68, -0.01);
      g.add(ear, inner);
    }
    return g;
  }

  /* ----- spawning ----- */
  private spawnRow() {
    const hard = Math.min(1, this.t / 70);
    const free = [0, 1, 2].map((l) => this.busy[l] <= this.dist);
    const row: (Kind | "busy" | null)[] = [0, 1, 2].map((l) => {
      if (!free[l]) return "busy";
      const r = Math.random();
      return r < 0.32 - hard * 0.12 ? null : r < 0.52 ? "low" : r < 0.7 ? "high" : "pod";
    });
    // never block all three lanes: trains + busy lanes must leave one passable lane
    const blocked = () => row.filter((k) => k === "pod" || k === "busy").length;
    for (let l = 0; l < 3 && blocked() > 2; l++) if (row[l] === "pod") row[l] = "low";
    if (blocked() === 3) return;
    row.forEach((k, l) => {
      if (k === "pod") {
        const n = 1 + (Math.random() < 0.35 + hard * 0.3 ? 1 : 0) + (Math.random() < hard * 0.4 ? 1 : 0);
        const moving = Math.random() < 0.12 + hard * 0.25;
        const len = n * CAR + (n - 1) * CAR_GAP;
        this.busy[l] = this.dist + len + (moving ? 70 : 6);
        this.add("pod", l, SPAWN_Z, 0, { n, moving });
      } else if (k === "low" || k === "high") this.add(k, l, SPAWN_Z);
    });
    const open = [0, 1, 2].filter((l) => row[l] === null || row[l] === "low" || row[l] === "high");
    const cl = open[Math.floor(Math.random() * open.length)];
    const arc = row[cl] === "low";
    for (let i = 0; i < 5; i++) this.add("c", cl, SPAWN_Z + (i - 2) * 2.4, arc ? [0.9, 1.9, 2.5, 1.9, 0.9][i] : 0.9);
  }

  private add(k: Kind, l: number, z: number, y = 0, train?: { n: number; moving: boolean }) {
    let m: THREE.Object3D, len = 0, vz = 0;
    if (k === "c" && this.props.cheese) {
      m = this.props.cheese.clone();
      m.position.y = y;
    } else if (k === "c") {
      m = new THREE.Mesh(this.geo.cheese, this.mat.cheese);
      m.position.y = y;
    } else if (k === "low") {
      m = this.buildJump();
    } else if (k === "high") {
      m = this.buildDuck();
    } else {
      const tr = train ?? { n: 1, moving: false };
      m = this.buildTrain(tr.n, tr.moving);
      len = m.userData.len as number;
      vz = tr.moving ? 9 : 0;
      z -= len / 2;
    }
    m.position.x = lx(l); m.position.z = z;
    this.scene.add(m);
    this.objs.push({ k, l, m, len, y, vz });
  }

  private playAnim(name: "run" | "jump" | "slide" | "die" | "idle") {
    const a = this.anims[name] ?? (name === "idle" ? this.anims.run : undefined);
    const key = a ? name : "";
    if (!a || this.curAnim === key) return;
    const prev = this.curAnim ? this.anims[this.curAnim as keyof typeof this.anims] ?? this.anims.run : undefined;
    a.reset().setEffectiveWeight(1).play();
    if (prev && prev !== a) prev.crossFadeTo(a, name === "die" ? 0.1 : 0.15, false);
    this.curAnim = key;
  }

  /* ----- loop ----- */
  private frame = (now: number) => {
    this.raf = requestAnimationFrame(this.frame);
    const dt = Math.min(0.033, (now - this.last) / 1000);
    this.last = now;
    this.update(dt);
    this.composer.render(dt);
  };

  private update(dt: number) {
    if (this.paused) return;
    const running = this.mode === "run";
    if (this.mode === "idle") this.speed = 7;
    if (running) {
      this.t += dt;
      this.speed = 22 + Math.min(26, this.t * 0.45);
    }
    const dz = this.mode === "dying" || this.mode === "over" ? 0 : this.speed * dt;

    // scroll the world toward the camera
    this.dist += dz;
    this.trackTex.offset.y += dz / 4;
    this.sleepers.position.z = this.dist % 1.2;
    for (const w of this.walls) { w.position.z += dz; if (w.position.z - WALL / 2 > 20) w.position.z -= this.walls.length / 2 * WALL; }
    for (const b of this.bridges) { b.position.z += dz; if (b.position.z > 24) b.position.z -= 220; }
    for (const side of [-1, 1]) this.farZ[side] += dz;
    for (const b of this.buildings) {
      b.g.position.z += dz;
      if (b.g.position.z - b.d / 2 > 16) {
        const gap = rnd(0.6, 2.4);
        b.g.position.z = this.farZ[b.side] - gap - b.d / 2;
        this.farZ[b.side] = b.g.position.z - b.d / 2;
      }
    }
    for (const l of this.lamps) { l.position.z += dz; if (l.position.z > 16) l.position.z -= 14 * 12; }
    for (const o of this.street) { o.position.z += dz; if (o.position.z > 18) o.position.z -= 16 * 15; }

    // player physics
    const tx = lx(this.lane);
    this.px += (tx - this.px) * Math.min(1, dt * 18);
    if (this.mode !== "dying" && this.mode !== "over") {
      this.vy -= 34 * dt;
      this.py = Math.max(0, this.py + this.vy * dt);
      if (this.py === 0 && this.vy < 0) this.vy = 0;
      this.slide = Math.max(0, this.slide - dt);
    }
    const sliding = this.slide > 0 && this.py < 0.05;

    // objects + collisions
    if (running || this.mode === "dying") {
      if (running) {
        this.score += dz * 1.1;
        this.next -= dz;
        if (this.next <= 0) { this.spawnRow(); this.next = Math.max(16, this.speed * 0.8); }
      }
      const bodyLo = this.py + 0.3, bodyHi = this.py + (sliding ? 1.1 : 2.0);
      for (const o of this.objs) {
        o.m.position.z += dz + (running ? (o.vz ?? 0) * dt : 0);
        if (o.k === "c" && o.hit) {
          // squash-and-pop on pickup
          o.ht = (o.ht ?? 0) + dt;
          const k = Math.min(1, o.ht / 0.18);
          o.m.scale.set(1 + 0.8 * k, Math.max(0.05, 1 - 0.85 * k), 1 + 0.8 * k);
          o.m.position.y += dt * 3;
          continue;
        }
        if (o.k === "c") { o.m.rotation.y += dt * 3; o.m.position.y = o.y + Math.sin(this.t * 4 + o.m.position.z) * 0.08; }
        if (o.hit || !running) continue;
        const z = o.m.position.z;
        const inLane = Math.abs(lx(o.l) - this.px) < 1.0;
        if (o.k === "c") {
          if (Math.abs(z) < 0.9 && (this.opts.magnet || (inLane && o.y > bodyLo - 0.5 && o.y < bodyHi + 0.4))) {
            o.hit = true; o.ht = 0; this.cheese += this.opts.double ? 2 : 1;
            if (this.onPickup) {
              const v = o.m.getWorldPosition(new THREE.Vector3()).project(this.camera);
              this.onPickup((v.x + 1) / 2 * this.el.clientWidth, (1 - v.y) / 2 * this.el.clientHeight);
            }
          }
        } else if (inLane) {
          const near = o.k === "pod" ? z + o.len / 2 : z + 0.15, far = o.k === "pod" ? z - o.len / 2 : z - 0.15;
          if (near > -0.45 && far < 0.45) {
            if (o.k === "pod" || (o.k === "low" && this.py < 1.0) || (o.k === "high" && !sliding)) { this.mode = "dying"; this.dieT = 0; }
          }
        }
      }
      for (let i = this.objs.length - 1; i >= 0; i--) {
        const o = this.objs[i];
        if ((o.hit && o.k === "c" && (o.ht ?? 0) > 0.18) || o.m.position.z - o.len / 2 > 14) { this.scene.remove(o.m); this.objs.splice(i, 1); }
      }
      if (running) this.onHud(Math.floor(this.score), this.cheese);
    }

    // player pose
    this.rig.position.set(this.px, this.py, 0);
    this.rig.rotation.z = (this.px - tx) * 0.12;
    this.rig.rotation.x = this.vy > 0 ? -0.12 : 0;
    const crouch = sliding ? 0.55 : 1;
    const squash = this.anims.slide ? 1 : crouch; // squash only when there is no slide animation
    this.holder.scale.y += (squash - this.holder.scale.y) * Math.min(1, dt * 20);
    if (this.mixer) {
      const want = this.mode === "dying" || this.mode === "over" ? "die" : this.mode === "idle" ? "idle" : this.py > 0.05 ? "jump" : sliding ? "slide" : "run";
      this.playAnim(want);
      if (this.anims.run) this.anims.run.timeScale = this.mode === "run" ? this.speed / 22 : 1;
      if (this.mode !== "over" || this.curAnim === "die") this.mixer.update(dt);
    }
    this.holder.position.y = this.mode === "idle" ? Math.sin(performance.now() / 300) * 0.04 : 0;
    this.shadow.position.set(this.px, 0.02, 0);
    this.shadow.scale.setScalar(Math.max(0.4, 1 - this.py * 0.2));

    // camera
    const camX = this.px * 0.55;
    this.camera.position.set(camX, 3.9 + this.py * 0.25, 7.6);
    if (this.mode === "dying") {
      this.dieT += dt;
      this.camera.position.x += (Math.random() - 0.5) * 0.25 * (1 - this.dieT / 0.5);
      this.camera.position.y += (Math.random() - 0.5) * 0.25 * (1 - this.dieT / 0.5);
      if (this.dieT > 0.5) { this.mode = "over"; this.onEnd(Math.floor(this.score), this.cheese); }
    }
    this.camera.lookAt(camX * 0.6, 1.0, -8);
  }
}
