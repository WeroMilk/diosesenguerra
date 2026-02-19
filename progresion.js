/**
 * Dioses en Guerra - Progresión, logros y misiones diarias
 * Persistencia en localStorage.
 */

const PROGRESION_KEY = 'dioses_en_guerra_progresion';

const LOGROS = [
  { id: 'primera_victoria', nombre: 'Primera sangre', descripcion: 'Gana tu primera partida.' },
  { id: 'ganar_10', nombre: 'Veterano', descripcion: 'Gana 10 partidas.' },
  { id: 'ganar_1_jarcor', nombre: 'Derrotando a JARCOR', descripcion: 'Gana una partida contra la IA en nivel JARCOR.' },
  { id: 'usar_5_trampas', nombre: 'Estratega', descripcion: 'Usa 5 cartas de efecto (trampas) en una sola partida.' },
  { id: 'ataques_thor_10', nombre: 'Poder del trueno', descripcion: 'Ataca 10 veces con Thor en partidas (acumulado).' },
  { id: 'ataques_odin_5', nombre: 'Ojo de Odín', descripcion: 'Ataca 5 veces con Odín en partidas (acumulado).' },
  { id: 'victorias_survival_5', nombre: 'Superviviente', descripcion: 'Llega a ola 5 en modo Supervivencia.' },
  { id: 'completar_desafio', nombre: 'Desafiante', descripcion: 'Completa cualquier desafío.' }
];

const MISIONES_DIARIAS_TEMPLATE = [
  { id: 'dia_ganar_2', nombre: 'Gana 2 partidas', meta: 2, progresoKey: 'partidasGanadasHoy' },
  { id: 'dia_atacar_15', nombre: 'Realiza 15 ataques en total', meta: 15, progresoKey: 'ataquesHoy' },
  { id: 'dia_trampas_5', nombre: 'Usa 5 trampas/efectos en total', meta: 5, progresoKey: 'trampasUsadasHoy' }
];

const Progresion = {
  estado: null,
  contadoresPartida: null,

  cargar() {
    try {
      const raw = localStorage.getItem(PROGRESION_KEY);
      if (raw) {
        this.estado = JSON.parse(raw);
      }
    } catch (e) {}
    if (this.estado && this.estado.rendiciones == null) this.estado.rendiciones = 0;
    if (!this.estado) {
      this.estado = {
        logros: {},
        misionesDiarias: {},
        ultimaMisionFecha: null,
        desbloqueos: [],
        partidasGanadas: 0,
        partidasJugadas: 0,
        partidasGanadasHoy: 0,
        ataquesHoy: 0,
        trampasUsadasHoy: 0,
        estadisticasPorHeroe: {},
        nivelCampaniaDesbloqueado: 0,
        mejorRachaSurvival: 0,
        desafiosCompletados: {},
        mazosPersonalizados: [],
        rendiciones: 0
      };
    }
    this._rotarMisionesSiCambioDia();
    return this.estado;
  },

  guardar() {
    try {
      localStorage.setItem(PROGRESION_KEY, JSON.stringify(this.estado));
    } catch (e) {}
  },

  _rotarMisionesSiCambioDia() {
    const hoy = new Date().toDateString();
    if (this.estado.ultimaMisionFecha !== hoy) {
      this.estado.ultimaMisionFecha = hoy;
      this.estado.partidasGanadasHoy = 0;
      this.estado.ataquesHoy = 0;
      this.estado.trampasUsadasHoy = 0;
      this.estado.misionesDiarias = {};
      MISIONES_DIARIAS_TEMPLATE.forEach(m => {
        this.estado.misionesDiarias[m.id] = 0;
      });
      this.guardar();
    }
  },

  desbloquear(id) {
    if (!this.estado.desbloqueos.includes(id)) {
      this.estado.desbloqueos.push(id);
      this.guardar();
      return true;
    }
    return false;
  },

  registrarLogro(id) {
    if (this.estado.logros[id]) return false;
    this.estado.logros[id] = Date.now();
    this.guardar();
    return true;
  },

  registrarMision(id, progreso) {
    this.estado.misionesDiarias[id] = Math.min(progreso, MISIONES_DIARIAS_TEMPLATE.find(m => m.id === id)?.meta || progreso);
    this.guardar();
  },

  getProgreso() {
    return { ...this.estado };
  },

  getLogros() {
    return LOGROS.map(l => ({
      ...l,
      desbloqueado: !!this.estado.logros[l.id]
    }));
  },

  getMisionesDiarias() {
    this._rotarMisionesSiCambioDia();
    return MISIONES_DIARIAS_TEMPLATE.map(m => ({
      ...m,
      progreso: this.estado.misionesDiarias[m.id] || 0
    }));
  },

  iniciarPartida() {
    this.contadoresPartida = {
      trampasUsadas: 0,
      ataquesPorHeroe: {}
    };
  },

  registrarAccion(tipo, datos) {
    if (!this.contadoresPartida) return;
    if (tipo === 'atacar' && datos && datos.heroeId) {
      this.contadoresPartida.ataquesPorHeroe[datos.heroeId] = (this.contadoresPartida.ataquesPorHeroe[datos.heroeId] || 0) + 1;
      this.estado.ataquesHoy = (this.estado.ataquesHoy || 0) + 1;
    }
    if ((tipo === 'trampa' || tipo === 'efecto_mano') && datos) {
      this.contadoresPartida.trampasUsadas = (this.contadoresPartida.trampasUsadas || 0) + 1;
      this.estado.trampasUsadasHoy = (this.estado.trampasUsadasHoy || 0) + 1;
    }
    this.guardar();
  },

  finPartida(ganador, opciones) {
    opciones = opciones || {};
    const esPlayer = ganador === 'player';
    this.estado.partidasJugadas = (this.estado.partidasJugadas || 0) + 1;
    if (opciones.rendido) {
      this.estado.rendiciones = (this.estado.rendiciones || 0) + 1;
    }
    if (esPlayer) {
      this.estado.partidasGanadas = (this.estado.partidasGanadas || 0) + 1;
      this.estado.partidasGanadasHoy = (this.estado.partidasGanadasHoy || 0) + 1;
    }

    const logrosDesbloqueados = [];
    const misionesCompletadas = [];

    if (esPlayer) {
      if (this.estado.partidasGanadas >= 1 && this.registrarLogro('primera_victoria')) logrosDesbloqueados.push(LOGROS.find(l => l.id === 'primera_victoria'));
      if (this.estado.partidasGanadas >= 10 && this.registrarLogro('ganar_10')) logrosDesbloqueados.push(LOGROS.find(l => l.id === 'ganar_10'));
      if (opciones.dificultad === 'jarcor' && this.registrarLogro('ganar_1_jarcor')) logrosDesbloqueados.push(LOGROS.find(l => l.id === 'ganar_1_jarcor'));
    }
    if (this.contadoresPartida && this.contadoresPartida.trampasUsadas >= 5 && this.registrarLogro('usar_5_trampas')) logrosDesbloqueados.push(LOGROS.find(l => l.id === 'usar_5_trampas'));

    const aph = this.contadoresPartida && this.contadoresPartida.ataquesPorHeroe ? this.contadoresPartida.ataquesPorHeroe : {};
    Object.keys(aph).forEach(heroeId => {
      const baseId = heroeId.replace(/_[12]$/, '');
      this.estado.estadisticasPorHeroe[baseId] = (this.estado.estadisticasPorHeroe[baseId] || 0) + (aph[heroeId] || 0);
    });
    if ((this.estado.estadisticasPorHeroe['thor'] || 0) >= 10 && this.registrarLogro('ataques_thor_10')) logrosDesbloqueados.push(LOGROS.find(l => l.id === 'ataques_thor_10'));
    if ((this.estado.estadisticasPorHeroe['odin'] || 0) >= 5 && this.registrarLogro('ataques_odin_5')) logrosDesbloqueados.push(LOGROS.find(l => l.id === 'ataques_odin_5'));

    if (opciones.olaSurvival != null && opciones.olaSurvival >= 5 && this.registrarLogro('victorias_survival_5')) logrosDesbloqueados.push(LOGROS.find(l => l.id === 'victorias_survival_5'));
    if (opciones.desafioId && this.registrarLogro('completar_desafio')) logrosDesbloqueados.push(LOGROS.find(l => l.id === 'completar_desafio'));

    MISIONES_DIARIAS_TEMPLATE.forEach(m => {
      const valor = m.progresoKey === 'partidasGanadasHoy' ? this.estado.partidasGanadasHoy
        : m.progresoKey === 'ataquesHoy' ? this.estado.ataquesHoy
          : m.progresoKey === 'trampasUsadasHoy' ? this.estado.trampasUsadasHoy : 0;
      this.registrarMision(m.id, valor);
      if (valor >= m.meta) misionesCompletadas.push(m);
    });

    this.contadoresPartida = null;
    this.guardar();
    return { logrosDesbloqueados: logrosDesbloqueados.filter(Boolean), misionesCompletadas };
  },

  desbloquearNivelCampania(nivel) {
    if (nivel > this.estado.nivelCampaniaDesbloqueado) {
      this.estado.nivelCampaniaDesbloqueado = nivel;
      this.guardar();
      return true;
    }
    return false;
  },

  actualizarRachaSurvival(ola) {
    if (ola > (this.estado.mejorRachaSurvival || 0)) {
      this.estado.mejorRachaSurvival = ola;
      this.guardar();
    }
  },

  marcarDesafioCompletado(id) {
    this.estado.desafiosCompletados[id] = true;
    this.guardar();
  }
};

if (typeof window !== 'undefined') {
  Progresion.cargar();
}
