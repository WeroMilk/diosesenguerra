/**
 * Dioses en Guerra - Cliente multijugador online (WebSocket)
 * Conecta a un servidor que gestione salas y sincronice estado.
 * Sin servidor: mostrar mensaje "Servidor no disponible" o usar URL configurable.
 */
const Online = {
  ws: null,
  url: null,
  codigoSala: null,
  miRol: null,
  conectado: false,
  onEstado: null,
  onMensaje: null,
  onDesconectar: null,

  getDefaultUrl() {
    if (typeof window === 'undefined') return null;
    const u = window.location;
    const wsProto = u.protocol === 'https:' ? 'wss:' : 'ws:';
    return wsProto + '//' + u.hostname + (u.port ? ':' + u.port : '') + '/ws';
  },

  conectar(serverUrl) {
    this.url = serverUrl || this.getDefaultUrl();
    if (!this.url) return Promise.reject(new Error('No hay URL de servidor'));
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);
        this.ws.onopen = () => {
          this.conectado = true;
          resolve();
        };
        this.ws.onmessage = (ev) => {
          try {
            const data = JSON.parse(ev.data);
            this._manejarMensaje(data);
          } catch (e) {
            if (this.onMensaje) this.onMensaje({ tipo: 'error', texto: 'Mensaje inválido' });
          }
        };
        this.ws.onclose = () => {
          this.conectado = false;
          this.ws = null;
          if (this.onDesconectar) this.onDesconectar();
        };
        this.ws.onerror = () => reject(new Error('Error de conexión'));
      } catch (e) {
        reject(e);
      }
    });
  },

  _manejarMensaje(data) {
    if (data.type === 'sala_creada') {
      this.codigoSala = data.codigo;
      if (this.onMensaje) this.onMensaje({ tipo: 'sala_creada', codigo: data.codigo });
      return;
    }
    if (data.type === 'unido') {
      this.miRol = data.jugador;
      if (this.onMensaje) this.onMensaje({ tipo: 'unido', jugador: data.jugador });
      return;
    }
    if (data.type === 'mano_inicial') {
      if (this.onMensaje) this.onMensaje({ tipo: 'mano_inicial', manoInicial: data.manoInicial });
      return;
    }
    if (data.type === 'estado') {
      if (typeof Game !== 'undefined' && data.estado) {
        Game.estado = data.estado;
        if (this.onEstado) this.onEstado();
      }
      return;
    }
    if (data.type === 'accion_rival') {
      if (typeof Game !== 'undefined' && data.accion) this._aplicarAccionRemota(data.accion);
      if (this.onEstado) this.onEstado();
      return;
    }
    if (data.type === 'ganador') {
      if (typeof Game !== 'undefined' && Game.estado) Game.estado.ganador = data.ganador;
      if (this.onEstado) this.onEstado();
      if (this.onMensaje) this.onMensaje({ tipo: 'fin', ganador: data.ganador });
      return;
    }
    if (data.type === 'error' && this.onMensaje) this.onMensaje({ tipo: 'error', texto: data.texto || 'Error' });
  },

  _aplicarAccionRemota(accion) {
    const s = Game.estado;
    if (!s || s.ganador) return;
    const jugador = s.turnoActual;
    if (accion.tipo === 'terminar_turno') Game.terminarTurno();
    else if (accion.tipo === 'energia') Game.ponerEnergia(jugador, accion.indiceMano, accion.heroeSlot);
    else if (accion.tipo === 'atacar') Game.atacar(jugador, accion.atacanteSlot, accion.defensorSlot);
    else if (accion.tipo === 'activar_trampa') Game.activarTrampa(jugador, accion.slotBocaAbajo, accion.heroeSlot != null ? { heroeSlot: accion.heroeSlot } : {});
    else if (accion.tipo === 'usar_efecto_mano') Game.usarEfectoDesdeMano(jugador, accion.indiceMano, accion.heroeSlot != null ? { heroeSlot: accion.heroeSlot } : {});
    else if (accion.tipo === 'boca_abajo') Game.ponerBocaAbajoEnHeroe(jugador, accion.indiceBocaAbajo, accion.heroeSlot);
  },

  enviar(obj) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return false;
    try {
      this.ws.send(JSON.stringify(obj));
      return true;
    } catch (e) { return false; }
  },

  crearSala(nick) {
    return this.enviar({ type: 'crear_sala', nick: nick || 'Jugador' });
  },

  unirSala(codigo, nick) {
    return this.enviar({ type: 'unir_sala', codigo: (codigo || '').trim().toUpperCase(), nick: nick || 'Jugador' });
  },

  enviarSetup(heroes, bocaAbajo, mano) {
    return this.enviar({ type: 'setup', heroes, bocaAbajo, mano });
  },

  enviarAccion(accion) {
    return this.enviar({ type: 'accion', accion });
  },

  desconectar() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.conectado = false;
    this.codigoSala = null;
    this.miRol = null;
  },

  getRanking() {
    return Promise.resolve([]);
  }
};
