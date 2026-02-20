/**
 * Dioses en Guerra - Efectos de sonido y música Premium (Web Audio API)
 * Sistema de audio nivel Pokemon Pocket / Riot Games
 */
const Sounds = {
  ctx: null,
  enabled: true,
  musicaEnabled: true,
  effectsEnabled: true,
  _musicaOsc: null,
  _musicaGain: null,
  _musicaInterval: null,
  _masterGain: null,

  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      
      // Master gain para control de volumen global
      this._masterGain = this.ctx.createGain();
      this._masterGain.gain.value = 0.8;
      this._masterGain.connect(this.ctx.destination);
      
      try {
        const m = localStorage.getItem('dioses_musica');
        const e = localStorage.getItem('dioses_efectos');
        const v = localStorage.getItem('dioses_volumen');
        if (m !== null) this.musicaEnabled = m === '1';
        if (e !== null) this.effectsEnabled = e === '1';
        if (v !== null && this._masterGain) this._masterGain.gain.value = parseFloat(v);
      } catch (x) {}
    } catch (e) {}
  },

  // Beep mejorado con envelope ADSR
  beep(freq, duration, type, volume = 0.15, attack = 0.01, decay = 0.1) {
    if (!this.effectsEnabled || !this.enabled || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this._masterGain || this.ctx.destination);
      osc.frequency.value = freq;
      osc.type = type || 'sine';
      
      // Envelope ADSR mejorado
      const now = this.ctx.currentTime;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(volume, now + attack);
      gain.gain.linearRampToValueAtTime(volume * 0.7, now + attack + decay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      
      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {}
  },

  // Crear ruido blanco para efectos de impacto
  createNoise(duration, volume = 0.1) {
    if (!this.effectsEnabled || !this.ctx) return;
    try {
      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      }
      
      const source = this.ctx.createBufferSource();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      
      source.buffer = buffer;
      filter.type = 'lowpass';
      filter.frequency.value = 1000;
      
      source.connect(filter);
      filter.connect(gain);
      gain.connect(this._masterGain || this.ctx.destination);
      
      gain.gain.setValueAtTime(volume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      
      source.start();
    } catch (e) {}
  },

  // Sweep de frecuencia para efectos dramáticos
  sweep(startFreq, endFreq, duration, type = 'sine', volume = 0.12) {
    if (!this.effectsEnabled || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this._masterGain || this.ctx.destination);
      osc.type = type;
      
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);
      
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      
      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {}
  },

  // ==========================================
  // EFECTOS DE SONIDO MEJORADOS
  // ==========================================

  robar() {
    this.init();
    // Sonido de carta deslizándose - más suave y satisfactorio
    this.beep(350, 0.08, 'sine', 0.1, 0.005, 0.02);
    setTimeout(() => this.beep(450, 0.08, 'sine', 0.1), 50);
    setTimeout(() => this.beep(550, 0.1, 'sine', 0.08), 100);
    setTimeout(() => this.beep(700, 0.06, 'triangle', 0.06), 150);
  },

  atacar() {
    this.init();
    // Impacto épico con layers de sonido
    this.createNoise(0.15, 0.2);
    this.sweep(200, 60, 0.2, 'sawtooth', 0.18);
    this.beep(80, 0.15, 'square', 0.15);
    
    setTimeout(() => {
      this.beep(60, 0.1, 'sawtooth', 0.12);
      this.createNoise(0.08, 0.1);
    }, 50);
  },

  // Ataque crítico - más dramático
  atacarCritico() {
    this.init();
    this.createNoise(0.2, 0.25);
    this.sweep(300, 40, 0.25, 'sawtooth', 0.22);
    this.beep(100, 0.08, 'square', 0.2);
    this.beep(50, 0.2, 'sawtooth', 0.18);
    
    setTimeout(() => {
      this.beep(40, 0.15, 'sawtooth', 0.12);
      this.beep(80, 0.1, 'square', 0.1);
    }, 80);
    
    setTimeout(() => this.createNoise(0.1, 0.08), 150);
  },

  ponerEnergia() {
    this.init();
    // Sonido mágico de energía - más satisfactorio
    this.beep(350, 0.08, 'sine', 0.12, 0.01, 0.02);
    setTimeout(() => this.beep(440, 0.1, 'sine', 0.12), 40);
    setTimeout(() => this.beep(550, 0.12, 'triangle', 0.1), 80);
    setTimeout(() => this.beep(660, 0.08, 'sine', 0.08), 120);
  },

  trampa() {
    this.init();
    // Revelación dramática de trampa
    this.sweep(200, 800, 0.15, 'triangle', 0.15);
    this.beep(700, 0.1, 'sine', 0.12);
    
    setTimeout(() => {
      this.beep(900, 0.15, 'sine', 0.14);
      this.beep(1100, 0.1, 'triangle', 0.08);
    }, 80);
    
    setTimeout(() => this.beep(800, 0.2, 'sine', 0.06), 180);
  },

  heroeDestruido() {
    this.init();
    // Muerte épica con impacto
    this.createNoise(0.25, 0.2);
    this.sweep(400, 50, 0.4, 'sawtooth', 0.18);
    this.beep(200, 0.1, 'square', 0.15);
    
    setTimeout(() => {
      this.beep(150, 0.2, 'sawtooth', 0.14);
      this.createNoise(0.15, 0.12);
    }, 80);
    
    setTimeout(() => {
      this.beep(100, 0.25, 'sawtooth', 0.1);
      this.sweep(150, 40, 0.3, 'sawtooth', 0.08);
    }, 180);
    
    setTimeout(() => this.beep(60, 0.3, 'sawtooth', 0.06), 350);
  },

  // Curación - sonido mágico ascendente
  curacion() {
    this.init();
    const notes = [400, 500, 600, 750, 900];
    notes.forEach((f, i) => {
      setTimeout(() => {
        this.beep(f, 0.15, 'sine', 0.1 - i * 0.01);
        if (i > 0) this.beep(f * 1.5, 0.1, 'triangle', 0.05);
      }, i * 60);
    });
  },

  inicioTurno() {
    this.init();
    // Fanfarria corta de turno
    this.beep(523, 0.1, 'sine', 0.12);
    setTimeout(() => this.beep(659, 0.1, 'sine', 0.12), 60);
    setTimeout(() => this.beep(784, 0.15, 'triangle', 0.1), 120);
  },

  // Inicio de turno del rival - más ominoso
  inicioTurnoRival() {
    this.init();
    this.beep(220, 0.12, 'sawtooth', 0.1);
    setTimeout(() => this.beep(196, 0.12, 'sawtooth', 0.1), 80);
    setTimeout(() => this.beep(165, 0.18, 'sawtooth', 0.08), 160);
  },

  ganar() {
    this.init();
    // Fanfarria de victoria épica
    const melody = [
      { f: 523, d: 0.15, t: 0 },
      { f: 659, d: 0.15, t: 120 },
      { f: 784, d: 0.15, t: 240 },
      { f: 1047, d: 0.25, t: 360 },
      { f: 880, d: 0.12, t: 550 },
      { f: 1047, d: 0.12, t: 650 },
      { f: 1318, d: 0.4, t: 750 }
    ];
    
    melody.forEach(note => {
      setTimeout(() => {
        this.beep(note.f, note.d, 'sine', 0.14);
        this.beep(note.f * 0.5, note.d, 'triangle', 0.06);
      }, note.t);
    });
    
    // Acorde final
    setTimeout(() => {
      this.beep(1047, 0.6, 'sine', 0.1);
      this.beep(1318, 0.6, 'sine', 0.08);
      this.beep(1568, 0.6, 'triangle', 0.06);
    }, 900);
  },

  perder() {
    this.init();
    // Sonido de derrota dramático
    this.beep(300, 0.2, 'sawtooth', 0.15);
    this.sweep(300, 100, 0.5, 'sawtooth', 0.12);
    
    setTimeout(() => {
      this.beep(200, 0.3, 'sawtooth', 0.12);
      this.beep(100, 0.25, 'square', 0.08);
    }, 200);
    
    setTimeout(() => {
      this.beep(80, 0.5, 'sawtooth', 0.1);
      this.sweep(150, 50, 0.4, 'sawtooth', 0.06);
    }, 450);
  },

  click() {
    this.init();
    this.beep(600, 0.04, 'sine', 0.08, 0.005, 0.01);
  },

  // Hover sobre carta
  hover() {
    this.init();
    this.beep(400, 0.03, 'sine', 0.04, 0.005, 0.01);
  },

  // Seleccionar carta
  seleccionar() {
    this.init();
    this.beep(500, 0.06, 'sine', 0.1);
    setTimeout(() => this.beep(650, 0.05, 'triangle', 0.06), 30);
  },

  // Cancelar acción
  cancelar() {
    this.init();
    this.beep(400, 0.08, 'sawtooth', 0.08);
    setTimeout(() => this.beep(300, 0.1, 'sawtooth', 0.06), 60);
  },

  // Habilidad especial activada
  habilidadEspecial() {
    this.init();
    this.sweep(300, 1200, 0.3, 'sine', 0.15);
    this.beep(800, 0.15, 'triangle', 0.12);
    
    setTimeout(() => {
      this.beep(1000, 0.2, 'sine', 0.1);
      this.beep(1200, 0.15, 'triangle', 0.08);
    }, 150);
    
    setTimeout(() => this.beep(1400, 0.25, 'sine', 0.06), 280);
  },

  // Rayo (Thor)
  rayo() {
    this.init();
    this.createNoise(0.15, 0.25);
    this.sweep(2000, 100, 0.2, 'sawtooth', 0.2);
    this.beep(80, 0.15, 'square', 0.15);
    
    setTimeout(() => {
      this.createNoise(0.1, 0.15);
      this.beep(60, 0.2, 'sawtooth', 0.1);
    }, 100);
  },

  // Fuego (Lucifer)
  fuego() {
    this.init();
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        this.createNoise(0.08, 0.08);
        this.beep(200 + Math.random() * 100, 0.1, 'sawtooth', 0.08);
      }, i * 40);
    }
    this.sweep(150, 400, 0.25, 'sawtooth', 0.1);
  },

  // Petrificación (Medusa)
  petrificar() {
    this.init();
    this.sweep(800, 200, 0.4, 'triangle', 0.12);
    this.beep(300, 0.3, 'sine', 0.1);
    
    setTimeout(() => {
      this.beep(200, 0.25, 'sine', 0.08);
      this.createNoise(0.15, 0.06);
    }, 200);
  },

  // Fénix renace
  fenixRenacer() {
    this.init();
    // Ascenso dramático
    const notes = [200, 300, 400, 500, 650, 800, 1000, 1200];
    notes.forEach((f, i) => {
      setTimeout(() => {
        this.beep(f, 0.12, 'sine', 0.1);
        this.beep(f * 1.5, 0.08, 'triangle', 0.05);
      }, i * 50);
    });
    
    // Explosión de fuego
    setTimeout(() => {
      this.createNoise(0.2, 0.15);
      this.sweep(400, 1600, 0.3, 'sawtooth', 0.12);
    }, 350);
  },

  // Bloqueo de daño (escudo)
  bloquear() {
    this.init();
    this.beep(200, 0.08, 'square', 0.15);
    this.beep(400, 0.1, 'sine', 0.12);
    setTimeout(() => {
      this.beep(600, 0.12, 'triangle', 0.1);
      this.createNoise(0.08, 0.08);
    }, 50);
  },

  musica(play) {
    this.init();
    if (!this.musicaEnabled || !this.ctx) return;
    if (play) {
      if (this._musicaInterval) return;
      try {
        // Música de fondo más elaborada con acordes
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        
        osc1.type = 'sine';
        osc2.type = 'triangle';
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        
        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(this._masterGain || this.ctx.destination);
        
        gain.gain.setValueAtTime(0.03, this.ctx.currentTime);
        osc1.frequency.value = 164;
        osc2.frequency.value = 123;
        
        osc1.start(this.ctx.currentTime);
        osc2.start(this.ctx.currentTime);
        
        this._musicaOsc = osc1;
        this._musicaOsc2 = osc2;
        this._musicaGain = gain;
        
        let step = 0;
        const progression = [
          { n1: 164, n2: 123 }, // E minor
          { n1: 196, n2: 146 }, // G major
          { n1: 146, n2: 110 }, // D minor
          { n1: 164, n2: 123 }, // E minor
          { n1: 130, n2: 98 },  // C major
          { n1: 146, n2: 110 }, // D minor
          { n1: 164, n2: 123 }, // E minor
          { n1: 196, n2: 146 }  // G major
        ];
        
        this._musicaInterval = setInterval(() => {
          if (!this._musicaOsc || !this.musicaEnabled) return;
          try {
            const chord = progression[step % progression.length];
            this._musicaOsc.frequency.setTargetAtTime(chord.n1, this.ctx.currentTime, 0.5);
            if (this._musicaOsc2) {
              this._musicaOsc2.frequency.setTargetAtTime(chord.n2, this.ctx.currentTime, 0.5);
            }
            step++;
          } catch (e) {}
        }, 2000);
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
      if (this._musicaOsc2) {
        try { this._musicaOsc2.stop(this.ctx.currentTime); } catch (x) {}
        this._musicaOsc2 = null;
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
  },

  setVolume(v) {
    if (!this.ctx || !this._masterGain) return;
    const vol = Math.max(0, Math.min(1, v));
    this._masterGain.gain.value = vol;
    try { localStorage.setItem('dioses_volumen', vol.toString()); } catch (e) {}
  },

  getVolume() {
    if (!this._masterGain) return 0.8;
    return this._masterGain.gain.value;
  }
};
