/**
 * Dioses en Guerra - Efectos de sonido y música (Web Audio API, sin archivos)
 */
const Sounds = {
  ctx: null,
  enabled: true,
  musicaEnabled: true,
  effectsEnabled: true,
  _musicaOsc: null,
  _musicaGain: null,
  _musicaInterval: null,

  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      try {
        const m = localStorage.getItem('dioses_musica');
        const e = localStorage.getItem('dioses_efectos');
        if (m !== null) this.musicaEnabled = m === '1';
        if (e !== null) this.effectsEnabled = e === '1';
      } catch (x) {}
    } catch (e) {}
  },

  beep(freq, duration, type, volume = 0.15) {
    if (!this.effectsEnabled || !this.enabled || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.frequency.value = freq;
      osc.type = type || 'sine';
      gain.gain.setValueAtTime(volume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
      osc.start(this.ctx.currentTime);
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {}
  },

  robar() {
    this.init();
    this.beep(420, 0.07, 'sine', 0.12);
    setTimeout(() => this.beep(520, 0.07, 'sine', 0.12), 70);
    setTimeout(() => this.beep(640, 0.06, 'sine', 0.1), 140);
  },

  atacar() {
    this.init();
    this.beep(120, 0.04, 'square', 0.18);
    this.beep(90, 0.12, 'sawtooth', 0.12);
    setTimeout(() => this.beep(80, 0.08, 'sawtooth', 0.08), 80);
  },

  ponerEnergia() {
    this.init();
    this.beep(352, 0.06, 'sine', 0.12);
    setTimeout(() => this.beep(440, 0.08, 'sine', 0.1), 55);
  },

  trampa() {
    this.init();
    this.beep(640, 0.08, 'triangle', 0.14);
    setTimeout(() => this.beep(880, 0.1, 'sine', 0.12), 90);
  },

  heroeDestruido() {
    this.init();
    this.beep(200, 0.08, 'sawtooth', 0.14);
    setTimeout(() => this.beep(130, 0.18, 'sawtooth', 0.12), 90);
    setTimeout(() => this.beep(100, 0.12, 'sawtooth', 0.08), 200);
  },

  inicioTurno() {
    this.init();
    this.beep(523, 0.07, 'sine', 0.1);
    setTimeout(() => this.beep(659, 0.07, 'sine', 0.1), 75);
  },

  ganar() {
    this.init();
    const notes = [523, 659, 784, 1047, 784, 1047];
    notes.forEach((f, i) => {
      setTimeout(() => this.beep(f, i < 4 ? 0.18 : 0.25, 'sine', 0.12), i * 140);
    });
  },

  perder() {
    this.init();
    this.beep(180, 0.15, 'sawtooth', 0.14);
    setTimeout(() => this.beep(140, 0.28, 'sawtooth', 0.12), 180);
  },

  click() {
    this.init();
    this.beep(600, 0.03, 'sine', 0.06);
  },

  musica(play) {
    this.init();
    if (!this.musicaEnabled || !this.ctx) return;
    if (play) {
      if (this._musicaInterval) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 164;
        gain.gain.setValueAtTime(0.025, this.ctx.currentTime);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime);
        this._musicaOsc = osc;
        this._musicaGain = gain;
        let step = 0;
        const notes = [164, 196, 146, 164, 130, 146, 164, 196];
        this._musicaInterval = setInterval(() => {
          if (!this._musicaOsc || !this.musicaEnabled) return;
          try {
            this._musicaOsc.frequency.setValueAtTime(notes[step % notes.length], this.ctx.currentTime);
            step++;
          } catch (e) {}
        }, 1600);
      } catch (e) {}
    } else {
      if (this._musicaInterval) {
        clearInterval(this._musicaInterval);
        this._musicaInterval = null;
      }
      if (this._musicaOsc) {
        try { this._musicaOsc.stop(this.ctx.currentTime); } catch (x) {}
        this._musicaOsc = null;
      }
      this._musicaGain = null;
    }
  },

  setMusicaEnabled(v) {
    this.musicaEnabled = !!v;
    try { localStorage.setItem('dioses_musica', v ? '1' : '0'); } catch (e) {}
    if (!v) this.musica(false);
  },

  setEffectsEnabled(v) {
    this.effectsEnabled = !!v;
    try { localStorage.setItem('dioses_efectos', v ? '1' : '0'); } catch (e) {}
  }
};
