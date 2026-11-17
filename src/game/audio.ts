/**
 * Cheese Chase audio: every sound is synthesised with the Web Audio API (no files, no licences).
 * Music is an original looping tune scheduled ahead of time so it never stutters.
 */
type Sfx = "pickup" | "jump" | "slide" | "lane" | "crash" | "land" | "start" | "click" | "gift";

const KEY = "sq_audio_v1";
class GameAudio {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private sfxBus!: GainNode;
  private musicBus!: GainNode;
  private timer = 0;
  private nextNote = 0;
  private step = 0;
  private combo = 0;
  private comboT = 0;
  musicOn = true;
  sfxOn = true;

  constructor() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY) || "{}");
      if (typeof s.music === "boolean") this.musicOn = s.music;
      if (typeof s.sfx === "boolean") this.sfxOn = s.sfx;
    } catch { /* defaults */ }
  }
  private save() { try { localStorage.setItem(KEY, JSON.stringify({ music: this.musicOn, sfx: this.sfxOn })); } catch { /* ignore */ } }

  /** Must be called from a user gesture (tap/click) the first time. */
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain(); this.master.gain.value = 0.8; this.master.connect(this.ctx.destination);
      this.sfxBus = this.ctx.createGain(); this.sfxBus.gain.value = this.sfxOn ? 0.9 : 0; this.sfxBus.connect(this.master);
      this.musicBus = this.ctx.createGain(); this.musicBus.gain.value = this.musicOn ? 0.32 : 0; this.musicBus.connect(this.master);
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
  }
  setMusic(on: boolean) { this.musicOn = on; this.save(); if (this.ctx) this.musicBus.gain.setTargetAtTime(on ? 0.32 : 0, this.ctx.currentTime, 0.05); }
  setSfx(on: boolean) { this.sfxOn = on; this.save(); if (this.ctx) this.sfxBus.gain.setTargetAtTime(on ? 0.9 : 0, this.ctx.currentTime, 0.05); }

  /* ---------- sound effects ---------- */
  private tone(freq: number, dur: number, type: OscillatorType, vol: number, slideTo?: number, at = 0) {
    const c = this.ctx!, t = c.currentTime + at;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.sfxBus); o.start(t); o.stop(t + dur + 0.02);
  }
  private noise(dur: number, vol: number, from: number, to: number, at = 0) {
    const c = this.ctx!, t = c.currentTime + at;
    const buf = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(); src.buffer = buf;
    const f = c.createBiquadFilter(); f.type = "bandpass"; f.Q.value = 1.2;
    f.frequency.setValueAtTime(from, t); f.frequency.exponentialRampToValueAtTime(to, t + dur);
    const g = c.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(this.sfxBus); src.start(t);
  }
  sfx(n: Sfx) {
    if (!this.ctx || !this.sfxOn) return;
    switch (n) {
      case "pickup": {
        // pitch climbs with quick successive pickups (a cheese "combo")
        const now = this.ctx.currentTime;
        this.combo = now - this.comboT < 0.6 ? Math.min(this.combo + 1, 10) : 0;
        this.comboT = now;
        const base = 880 * Math.pow(2, this.combo / 12 * 2);
        this.tone(base, 0.08, "square", 0.08);
        this.tone(base * 1.5, 0.12, "triangle", 0.1, undefined, 0.05);
        break;
      }
      case "jump": this.tone(300, 0.22, "triangle", 0.18, 760); this.noise(0.18, 0.08, 800, 3000); break;
      case "slide": this.noise(0.32, 0.16, 2400, 400); break;
      case "lane": this.noise(0.09, 0.06, 1800, 3600); break;
      case "land": this.tone(140, 0.08, "sine", 0.14, 80); break;
      case "crash":
        this.tone(160, 0.5, "sawtooth", 0.25, 40);
        this.noise(0.45, 0.35, 1200, 120);
        this.tone(90, 0.6, "sine", 0.3, 45, 0.02);
        break;
      case "start": [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.12, "square", 0.07, undefined, i * 0.07)); break;
      case "click": this.tone(1200, 0.05, "square", 0.05); break;
      case "gift": [784, 988, 1175, 1568].forEach((f, i) => this.tone(f, 0.18, "triangle", 0.12, undefined, i * 0.09)); break;
    }
  }

  /* ---------- music: original 8-bar loop in A minor pentatonic, 118 bpm ---------- */
  private static BPM = 118;
  // melody (semitones from A4, null = rest), 16th-note grid, 128 steps
  private static MEL: (number | null)[] = [
    0, null, 3, null, 5, null, 7, 5, null, 3, null, 0, null, null, -2, null,
    0, null, 3, null, 5, 7, null, 10, null, 7, 5, null, 3, null, null, null,
    12, null, 10, null, 7, null, 5, 7, null, 5, null, 3, null, 0, null, null,
    3, null, 5, null, 7, null, 3, null, 0, null, -2, null, 0, null, null, null,
    0, null, 3, 5, null, 7, null, 10, 12, null, 10, null, 7, null, 5, null,
    7, null, 5, null, 3, null, 5, null, 7, null, null, 10, null, 7, null, null,
    12, null, 15, null, 12, null, 10, null, 7, null, 10, null, 12, null, null, null,
    10, null, 7, null, 5, null, 3, null, 0, null, null, null, null, null, null, null,
  ];
  private static BASS = [0, 0, -4, -4, -9, -9, -7, -7]; // per bar: A F D E (roots)
  startMusic() {
    if (!this.ctx || this.timer) return;
    this.nextNote = this.ctx.currentTime + 0.1;
    this.step = 0;
    this.timer = window.setInterval(() => this.schedule(), 50);
  }
  stopMusic() { window.clearInterval(this.timer); this.timer = 0; }
  private schedule() {
    const c = this.ctx!;
    const sixteenth = 60 / GameAudio.BPM / 4;
    while (this.nextNote < c.currentTime + 0.15) {
      const i = this.step % 128, bar = Math.floor(i / 16), t = this.nextNote;
      const m = GameAudio.MEL[i];
      if (m !== null) this.note(440 * Math.pow(2, m / 12), t, sixteenth * 1.6, "square", 0.05);
      if (i % 4 === 0) this.note(110 * Math.pow(2, GameAudio.BASS[bar] / 12), t, sixteenth * 3.4, "triangle", 0.16);
      if (i % 8 === 4) this.hat(t, 0.06);
      if (i % 2 === 0) this.hat(t, 0.018);
      if (i % 8 === 0) this.kick(t);
      this.nextNote += sixteenth;
      this.step++;
    }
  }
  private note(f: number, t: number, dur: number, type: OscillatorType, vol: number) {
    const c = this.ctx!, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.musicBus); o.start(t); o.stop(t + dur + 0.02);
  }
  private hat(t: number, vol: number) {
    const c = this.ctx!, len = Math.ceil(c.sampleRate * 0.04);
    const buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = c.createBufferSource(); s.buffer = buf;
    const f = c.createBiquadFilter(); f.type = "highpass"; f.frequency.value = 6000;
    const g = c.createGain(); g.gain.value = vol;
    s.connect(f); f.connect(g); g.connect(this.musicBus); s.start(t);
  }
  private kick(t: number) {
    const c = this.ctx!, o = c.createOscillator(), g = c.createGain();
    o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    g.gain.setValueAtTime(0.35, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    o.connect(g); g.connect(this.musicBus); o.start(t); o.stop(t + 0.18);
  }
}

let inst: GameAudio | null = null;
export function audio() {
  if (!inst) inst = new GameAudio();
  return inst;
}
