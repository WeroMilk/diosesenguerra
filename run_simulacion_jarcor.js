/**
 * Ejecuta simulaciones JARCOR vs JARCOR hasta que el jugador (player) gane 100 veces.
 * Uso: node run_simulacion_jarcor.js
 * Requiere: cartas.js, game.js, ia.js en el mismo directorio (sin dependencias de DOM).
 */

const fs = require('fs');
const path = require('path');
const dir = __dirname;
const globalObj = typeof globalThis !== 'undefined' ? globalThis : global;

// Cargar módulos del juego: ejecutar en un scope que expone Game/IA al global para que ia.js los vea
const cartasCode = fs.readFileSync(path.join(dir, 'cartas.js'), 'utf8');
const gameCode = fs.readFileSync(path.join(dir, 'game.js'), 'utf8');
const iaCode = fs.readFileSync(path.join(dir, 'ia.js'), 'utf8');

(function (g) {
  eval(cartasCode);
  eval(gameCode + '\ng.Game = typeof Game !== "undefined" ? Game : null;');
  eval(iaCode + '\ng.IA = typeof IA !== "undefined" ? IA : null;');
})(globalObj);

const Game = globalObj.Game;
const IA = globalObj.IA;
if (!Game || !IA) throw new Error('No se cargaron Game o IA. Game=' + !!Game + ', IA=' + !!IA);

const MAX_TURNOS_PARTIDA = 800;

function swapStateForPlayerIA() {
  const s = Game.estado;
  if (!s || s.ganador) return;
  const tmpP = s.player;
  s.player = s.rival;
  s.rival = tmpP;
  const tmpT = s.turnoPerdido.player;
  s.turnoPerdido.player = s.turnoPerdido.rival;
  s.turnoPerdido.rival = tmpT;
  s.turnoActual = 'rival';
}

function unswapState() {
  const s = Game.estado;
  if (!s || s.ganador) return;
  const tmpP = s.player;
  s.player = s.rival;
  s.rival = tmpP;
  const tmpT = s.turnoPerdido.player;
  s.turnoPerdido.player = s.turnoPerdido.rival;
  s.turnoPerdido.rival = tmpT;
  s.turnoActual = 'player';
}

function aplicarAccion(jugador, accion) {
  const s = Game.estado;
  if (!accion || s.ganador) return false;
  if (accion.tipo === 'terminar_turno') {
    Game.terminarTurno();
    return true;
  }
  if (accion.tipo === 'energia') {
    const r = Game.ponerEnergia(jugador, accion.indiceMano, accion.heroeSlot);
    return r && r.ok;
  }
  if (accion.tipo === 'boca_abajo') {
    const r = Game.ponerBocaAbajoEnHeroe(jugador, accion.indiceBocaAbajo, accion.heroeSlot);
    return r && r.ok;
  }
  if (accion.tipo === 'atacar') {
    const r = Game.atacar(jugador, accion.atacanteSlot, accion.defensorSlot);
    if (!r || !r.ok) return false;
    if (r.luciferQuemar) {
      const oponente = jugador === 'player' ? 'rival' : 'player';
      const mano = s[oponente].mano;
      if (mano.length > 0) Game.quemarCartaDe(oponente, Math.floor(Math.random() * mano.length));
    }
    return true;
  }
  if (accion.tipo === 'activar_trampa') {
    const parametros = accion.heroeSlot != null ? { heroeSlot: accion.heroeSlot } : {};
    const r = Game.activarTrampa(jugador, accion.slotBocaAbajo, parametros);
    return r && r.ok;
  }
  if (accion.tipo === 'usar_efecto_mano') {
    const parametros = accion.heroeSlot != null ? { heroeSlot: accion.heroeSlot } : {};
    const r = Game.usarEfectoDesdeMano(jugador, accion.indiceMano, parametros);
    return r && r.ok;
  }
  return false;
}

function jugarUnaPartida() {
  Game.iniciar('ia', 'jarcor');
  IA.dificultad = 'jarcor';
  const setupP = IA.elegirSetup(Game.estado.setupPlayer.manoInicial);
  const setupR = IA.elegirSetup(Game.estado.setupRival.manoInicial);
  Game.aplicarSetupJugador(setupP.heroes, setupP.bocaAbajo, setupP.mano);
  Game.aplicarSetupRival(setupR.heroes, setupR.bocaAbajo, setupR.mano);
  Game.finalizarSetup();

  let turnos = 0;
  while (!Game.estado.ganador && turnos < MAX_TURNOS_PARTIDA) {
    const jugador = Game.estado.turnoActual;
    let accion;
    if (jugador === 'rival') {
      accion = IA.jugar();
    } else {
      swapStateForPlayerIA();
      accion = IA.jugar();
      unswapState();
    }
    if (!accion) accion = { tipo: 'terminar_turno' };
    const ok = aplicarAccion(jugador, accion);
    if (!ok && accion.tipo !== 'terminar_turno') {
      Game.terminarTurno();
    }
    turnos++;
  }

  return {
    ganador: Game.estado.ganador,
    turnos,
    timeout: turnos >= MAX_TURNOS_PARTIDA
  };
}

function ejecutarHasta100Victorias() {
  let winsPlayer = 0;
  let winsRival = 0;
  let timeouts = 0;
  let totalPartidas = 0;
  const turnosPorPartida = [];
  const inicio = Date.now();

  while (winsPlayer < 100) {
    try {
      const r = jugarUnaPartida();
      totalPartidas++;
      if (r.timeout) {
        timeouts++;
      } else if (r.ganador === 'player') {
        winsPlayer++;
        turnosPorPartida.push(r.turnos);
      } else if (r.ganador === 'rival') {
        winsRival++;
      }
      if (totalPartidas % 50 === 0 && totalPartidas > 0) {
        console.log(`Partidas: ${totalPartidas}, Victorias jugador: ${winsPlayer}, IA: ${winsRival}, Timeouts: ${timeouts}`);
      }
    } catch (e) {
      console.error('Error en partida', totalPartidas + 1, e.message);
    }
  }

  const segundos = (Date.now() - inicio) / 1000;
  const turnosPromedio = turnosPorPartida.length ? turnosPorPartida.reduce((a, b) => a + b, 0) / turnosPorPartida.length : 0;

  return {
    winsPlayer: 100,
    winsRival,
    timeouts,
    totalPartidas,
    segundos,
    partidasPorSegundo: totalPartidas / segundos,
    turnosPromedioPorPartidaGanada: Math.round(turnosPromedio * 10) / 10
  };
}

console.log('Iniciando simulaciones JARCOR vs JARCOR hasta 100 victorias del jugador...\n');
const resultado = ejecutarHasta100Victorias();
console.log('\n--- RESULTADO ---');
console.log(JSON.stringify(resultado, null, 2));
console.log('\nTiempo total:', resultado.segundos.toFixed(1), 'segundos');
console.log('Partidas por segundo:', resultado.partidasPorSegundo.toFixed(2));
