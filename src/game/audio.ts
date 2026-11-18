/**
 * Cheese Chase audio: everything is synthesised with the Web Audio API (no files, no licences).
 * - Music: an original, upbeat loop (chords, bouncy lead with echo, bass, drums), scheduled ahead so it never stutters.
 * - SFX: polished game sounds through a compressor.
 * - Voice: an original squeaky "mouse" voice (pitch-gliding chirps through a formant filter).
 */
export type Sfx = "pickup" | "jump" | "slide" | "lane" | "crash" | "land" | "start" | "click" | "gift" | "powerup" | "shield";

const KEY = "sq_audio_v1";
const BPM = 124;

class GameAudio {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private sfxBus!: GainNode;
  private musicBus!: GainNode;
  private echoIn!: GainNode;
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
      const c = (this.ctx = new AC());
      const comp = c.createDynamicsCompressor();
      comp.threshold.value = -16; comp.knee.value = 12; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.2;
      this.master = c.createGain(); this.master.gain.value = 0.9;
      this.master.connect(comp); comp.connect(c.destination);
      this.sfxBus = c.createGain(); this.sfxBus.gain.value = this.sfxOn ? 0.85 : 0; this.sfxBus.connect(this.master);
      this.musicBus = c.createGain(); this.musicBus.gain.value = this.musicOn ? 0.3 : 0; this.musicBus.connect(this.master);
      // dotted-eighth echo for the lead
      const d = c.createDelay(1); d.delayTime.value = (60 / BPM) * 0.75;
      const fb = c.createGain(); fb.gain.value = 0.32;
      const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 2600;
      this.echoIn = c.createGain(); this.echoIn.gain.value = 0.35;
      this.echoIn.connect(d); d.connect(lp); lp.connect(fb); fb.connect(d); lp.connect(this.musicBus);
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
  }
  setMusic(on: boolean) { this.musicOn = on; this.save(); if (this.ctx) this.musicBus.gain.setTargetAtTime(on ? 0.3 : 0, this.ctx.currentTime, 0.05); }
  setSfx(on: boolean) { this.sfxOn = on; this.save(); if (this.ctx) this.sfxBus.gain.setTargetAtTime(on ? 0.85 : 0, this.ctx.currentTime, 0.05); }

  /* ---------- building blocks ---------- */
  private env(g: GainNode, t: number, a: number, peak: number, dur: number) {
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }
  private osc(type: OscillatorType, f: number, t: number, dur: number, peak: number, dest: AudioNode, glide?: number, attack = 0.005) {
    const c = this.ctx!, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (glide) o.frequency.exponentialRampToValueAtTime(glide, t + dur);
    this.env(g, t, attack, peak, dur);
    o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.03);
    return o;
  }
  private noise(t: number, dur: number, peak: number, type: BiquadFilterType, from: number, to: number, dest: AudioNode, q = 1) {
    const c = this.ctx!, n = Math.ceil(c.sampleRate * dur);
    const buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const s = c.createBufferSource(); s.buffer = buf;
    const f = c.createBiquadFilter(); f.type = type; f.Q.value = q;
    f.frequency.setValueAtTime(from, t); f.frequency.exponentialRampToValueAtTime(to, t + dur);
    const g = c.createGain(); this.env(g, t, 0.004, peak, dur);
    s.connect(f); f.connect(g); g.connect(dest); s.start(t);
  }

  /* ---------- the squeaky mouse voice ---------- */
  private chirp(t: number, f0: number, f1: number, dur: number, vol = 0.22) {
    const c = this.ctx!;
    const o = c.createOscillator(); o.type = "sawtooth";
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const vib = c.createOscillator(), vg = c.createGain(); vib.frequency.value = 28; vg.gain.value = f0 * 0.04;
    vib.connect(vg); vg.connect(o.frequency);
    const f1n = c.createBiquadFilter(); f1n.type = "bandpass"; f1n.frequency.value = 2400; f1n.Q.value = 3;
    const f2n = c.createBiquadFilter(); f2n.type = "bandpass"; f2n.frequency.value = 4200; f2n.Q.value = 4;
    const g = c.createGain(); this.env(g, t, 0.01, vol, dur);
    o.connect(f1n); o.connect(f2n); f1n.connect(g); f2n.connect(g); g.connect(this.sfxBus);
    o.start(t); vib.start(t); o.stop(t + dur + 0.03); vib.stop(t + dur + 0.03);
  }
  voice(kind: "wee" | "whoa" | "yay" | "eek" | "go" | "yum") {
    if (!this.ctx || !this.sfxOn) return;
    const t = this.ctx.currentTime;
    switch (kind) {
      case "wee": this.chirp(t, 900, 1700, 0.2); break;
      case "whoa": this.chirp(t, 1500, 800, 0.24); break;
      case "yay": this.chirp(t, 1000, 1400, 0.1); this.chirp(t + 0.11, 1300, 1900, 0.16); break;
      case "eek": this.chirp(t, 2000, 2400, 0.08, 0.26); this.chirp(t + 0.09, 2200, 900, 0.22, 0.24); break;
      case "go": this.chirp(t, 1100, 1300, 0.07); this.chirp(t + 0.09, 1200, 1500, 0.07); this.chirp(t + 0.19, 1300, 1900, 0.14); break;
      case "yum": this.chirp(t, 1300, 1600, 0.06, 0.12); break;
    }
  }

  /* ---------- sound effects ---------- */
  sfx(n: Sfx) {
    if (!this.ctx || !this.sfxOn) return;
    const t = this.ctx.currentTime, out = this.sfxBus;
    switch (n) {
      case "pickup": {
        // bright "bling" that climbs a scale on quick successive pickups
        this.combo = t - this.comboT < 0.7 ? Math.min(this.combo + 1, 12) : 0;
        this.comboT = t;
        const scale = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26, 28];
        const f = 1046.5 * Math.pow(2, scale[this.combo] / 12);
        this.osc("sine", f, t, 0.16, 0.16, out);
        this.osc("triangle", f * 2, t + 0.03, 0.14, 0.07, out);
        this.osc("sine", f * 3, t + 0.05, 0.1, 0.03, out);
        if (this.combo === 12) this.voice("yum");
        break;
      }
      case "jump":
        this.osc("sine", 280, t, 0.24, 0.24, out, 720);
        this.noise(t, 0.16, 0.06, "highpass", 2000, 6000, out);
        this.voice("wee");
        break;
      case "slide":
        this.noise(t, 0.34, 0.16, "bandpass", 3200, 500, out, 0.8);
        this.voice("whoa");
        break;
      case "lane": this.noise(t, 0.11, 0.07, "bandpass", 1400, 3800, out, 1.4); break;
      case "land": this.osc("sine", 130, t, 0.1, 0.18, out, 70); this.noise(t, 0.05, 0.04, "lowpass", 900, 300, out); break;
      case "crash":
        this.osc("sine", 120, t, 0.45, 0.4, out, 40);
        this.noise(t, 0.4, 0.3, "lowpass", 2400, 160, out);
        this.osc("square", 300, t + 0.02, 0.12, 0.06, out, 140);
        this.voice("eek");
        break;
      case "start":
        [523.3, 659.3, 784, 1046.5].forEach((f, i) => this.osc("triangle", f, t + i * 0.07, 0.16, 0.1, out));
        this.voice("go");
        break;
      case "powerup":
        [523.3, 659.3, 784, 1046.5, 1318.5].forEach((f, i) => { this.osc("square", f, t + i * 0.045, 0.12, 0.05, out); this.osc("sine", f * 2, t + i * 0.045, 0.14, 0.05, out); });
        this.voice("yay");
        break;
      case "shield": this.osc("sine", 520, t, 0.35, 0.16, out, 1040); this.noise(t, 0.3, 0.06, "bandpass", 3000, 9000, out, 2); break;
      case "click": this.osc("triangle", 1500, t, 0.04, 0.06, out); break;
      case "gift": [784, 988, 1175, 1568].forEach((f, i) => this.osc("triangle", f, t + i * 0.08, 0.2, 0.12, out)); this.voice("yay"); break;
    }
  }

  /* ---------- music: original loop in C major, 124 bpm, 8 bars ---------- */
  // chord roots per bar (semitones from C): C  Am  F  G  C  Em  F  G
  private static CHORDS = [[0, 4, 7], [9, 12, 16], [5, 9, 12], [7, 11, 14], [0, 4, 7], [4, 7, 11], [5, 9, 12], [7, 11, 14]];
  private static BASS = [0, -3, -7, -5, 0, -8, -7, -5];
  // lead: 16 steps per bar (semitones from C5, null = rest)
  private static LEAD: (number | null)[] = [
    7, null, 9, 7, null, 4, null, 2, 4, null, null, 7, null, null, null, null,
    9, null, 12, null, 9, 7, null, 4, null, 7, null, null, 4, null, 2, null,
    5, null, 9, null, 12, null, 9, 7, null, 5, null, 4, null, 2, null, null,
    2, null, 4, 5, null, 7, null, 11, null, 14, null, 12, null, null, null, null,
    7, null, 9, 7, null, 4, null, 7, 12, null, null, 14, null, 12, null, null,
    11, null, 7, null, 4, null, 7, null, 11, null, 12, null, 11, null, null, null,
    9, null, 12, null, 16, null, 14, 12, null, 9, null, 12, null, 14, null, null,
    12, null, 11, null, 14, null, 12, null, null, null, 19, null, null, null, null, null,
  ];
  startMusic() {
    if (!this.ctx || this.timer) return;
    this.nextNote = this.ctx.currentTime + 0.1;
    this.step = 0;
    this.timer = window.setInterval(() => this.schedule(), 40);
  }
  stopMusic() { window.clearInterval(this.timer); this.timer = 0; }
  private schedule() {
    const c = this.ctx!, s16 = 60 / BPM / 4, C5 = 523.25, C3 = 130.81;
    while (this.nextNote < c.currentTime + 0.18) {
      const i = this.step % 128, bar = Math.floor(i / 16), pos = i % 16;
      const swing = pos % 2 ? s16 * 0.12 : 0, t = this.nextNote + swing;
      const m = GameAudio.LEAD[i];
      if (m !== null) {
        const f = C5 * Math.pow(2, m / 12);
        const o = this.osc("square", f, t, s16 * 1.7, 0.045, this.musicBus);
        const o2 = this.osc("triangle", f * 2, t, s16 * 1.2, 0.025, this.echoIn);
        void o; void o2;
      }
      if (pos === 0 || pos === 8) for (const n of GameAudio.CHORDS[bar]) this.osc("triangle", C3 * 2 * Math.pow(2, n / 12), t, s16 * 7.5, 0.035, this.musicBus, undefined, 0.04);
      if (pos % 4 === 0 || pos === 6 || pos === 14) this.osc("triangle", C3 / 2 * Math.pow(2, GameAudio.BASS[bar] / 12) * (pos === 6 || pos === 14 ? 2 : 1), t, s16 * 1.8, 0.2, this.musicBus);
      if (pos % 8 === 0 || pos === 10) { this.osc("sine", 150, t, 0.16, 0.42, this.musicBus, 45); }
      if (pos === 4 || pos === 12) this.noise(t, 0.14, 0.13, "bandpass", 1800, 1200, this.musicBus, 0.7);
      if (pos % 2 === 0) this.noise(t, 0.035, pos % 4 === 2 ? 0.05 : 0.025, "highpass", 7000, 9000, this.musicBus);
      this.nextNote += s16;
      this.step++;
    }
  }
}

let inst: GameAudio | null = null;
export function audio() {
  if (!inst) inst = new GameAudio();
  return inst;
}
