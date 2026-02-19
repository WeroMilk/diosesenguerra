/**
 * Dioses en Guerra - Punto de entrada y flujo principal
 */

(function () {
  let modoPartida = 'ia';
  let dificultadPartida = 'facil';
  /** 'player1' = configurando Jugador 1 / Tú, 'player2' = configurando Jugador 2 (solo local) */
  let setupFase = null;
  /** Modo clic: null | { tipo: 'energia' } | { tipo: 'energia', indiceMano } | { tipo: 'atacar' } | { tipo: 'atacar', atacanteSlot } */
  let modoInteractivo = null;
  let torneoRonda = 0;
  let torneoGanadas = 0;
  let olaSurvivalActual = 1;
  let ultimoGanadorPartida = null;
  let sugerenciaActual = null;
  function esModoVsIA() { return modoPartida === 'ia' || modoPartida === 'campania' || modoPartida === 'torneo' || modoPartida === 'survival' || modoPartida === 'desafio'; }
  function swapParaSugerencia() {
    const s = Game.estado;
    if (!s || s.ganador) return;
    const t = s.player; s.player = s.rival; s.rival = t;
    const tt = s.turnoPerdido.player; s.turnoPerdido.player = s.turnoPerdido.rival; s.turnoPerdido.rival = tt;
    s.turnoActual = 'rival';
  }
  function unswapParaSugerencia() {
    const s = Game.estado;
    if (!s || s.ganador) return;
    const t = s.player; s.player = s.rival; s.rival = t;
    const tt = s.turnoPerdido.player; s.turnoPerdido.player = s.turnoPerdido.rival; s.turnoPerdido.rival = tt;
    s.turnoActual = 'player';
  }

  function cancelarModoInteractivo() {
    modoInteractivo = null;
    sugerenciaActual = null;
    if (UI.sugerenciaActual !== undefined) UI.sugerenciaActual = null;
    UI.establecerModoInteractivo(null);
    UI.renderizarTablero();
  }

  function sugerirJugada() {
    const s = Game.estado;
    if (!s || s.ganador || s.turnoActual !== 'player' || !esModoVsIA()) return;
    if (dificultadPartida !== 'facil' && dificultadPartida !== 'intermedio') return;
    const acciones = Game.getAccionesPosibles('player');
    if (!acciones || acciones.length === 0) return;
    swapParaSugerencia();
    const accion = IA.jugar();
    unswapParaSugerencia();
    if (accion && accion.tipo !== 'terminar_turno') {
      sugerenciaActual = accion;
      UI.sugerenciaActual = accion;
      UI.renderizarTablero();
      setTimeout(() => {
        sugerenciaActual = null;
        UI.sugerenciaActual = null;
        UI.renderizarTablero();
      }, 5000);
    }
  }

  var efectosDesdeMano = ['curacion', 'vision', 'robo', 'antidoto'];

  function ejecutarOpcionEfecto(opt) {
    var j = Game.estado.player;
    var necesitaHeroe = opt.efectoId === 'curacion' || opt.efectoId === 'antidoto';
    var heroesAliados = [];
    j.heroes.forEach(function (h, i) { if (h && h.vida > 0) heroesAliados.push({ heroeSlot: i, nombre: h.nombre, emoji: getEmojiCarta(h) }); });
    function ejecutar(heroeSlot) {
      var result;
      if (opt.tipo === 'boca_abajo') {
        result = Game.activarTrampa('player', opt.slot, heroeSlot != null ? { heroeSlot: heroeSlot } : {});
      } else {
        result = Game.usarEfectoDesdeMano('player', opt.indiceMano, heroeSlot != null ? { heroeSlot: heroeSlot } : {});
      }
      if (result.ok) {
        if (typeof Sounds !== 'undefined' && Sounds.trampa) Sounds.trampa();
        if (typeof Progresion !== 'undefined' && Progresion.registrarAccion) Progresion.registrarAccion('trampa', {});
        if (result.curacion != null && typeof GameLog !== 'undefined') GameLog.addHeal(result.jugadorCurado, result.heroeNombre, result.curacion);
        if (result.mostrarRival && typeof UI !== 'undefined') { /* visión */ }
        cancelarModoInteractivo();
        UI.renderizarTablero();
        if (result.curacion != null && result.jugadorCurado === 'player' && result.heroeSlot != null) {
          var heroSlotEl = document.querySelector('#player-zone .hero-slot[data-slot="' + result.heroeSlot + '"]');
          if (heroSlotEl) UI.animarCuracion(heroSlotEl);
        }
      } else {
        alert(result.msg || 'No se pudo usar el efecto.');
      }
    }
    if (necesitaHeroe && heroesAliados.length > 0) {
      if (heroesAliados.length === 1) ejecutar(heroesAliados[0].heroeSlot);
      else UI.mostrarModalSeleccion('Elige el héroe a curar o desenvenenar', heroesAliados, function (heroOpt) { if (heroOpt != null && heroOpt.heroeSlot != null) ejecutar(heroOpt.heroeSlot); });
    } else {
      ejecutar(null);
    }
  }

  function usarEfectoClick() {
    const s = Game.estado;
    if (!s || s.turnoActual !== 'player' || s.accionesRestantes < 1 || s.ganador) return;
    const j = s.player;
    const opciones = [];
    (j.bocaAbajo || []).forEach((carta, i) => {
      if (carta && carta.tipo === 'trampa') {
        const efectoId = carta.efectoId || carta.id;
        const nombre = carta.nombre || efectoId;
        opciones.push({ tipo: 'boca_abajo', slot: i, nombre: nombre + ' (soporte ' + (i + 1) + ')', efectoId, emoji: getEmojiCarta(carta) });
      }
    });
    j.mano.forEach((carta, i) => {
      if (carta && carta.tipo === 'trampa' && efectosDesdeMano.includes(carta.efectoId || carta.id)) {
        opciones.push({ tipo: 'mano', indiceMano: i, nombre: carta.nombre || (carta.efectoId || carta.id), efectoId: carta.efectoId || carta.id, emoji: getEmojiCarta(carta) });
      }
    });
    if (opciones.length === 0) {
      alert('No tienes cartas de efecto usables (curación, visión, robo o antídoto en mano o en soporte).');
      return;
    }
    UI.mostrarModalSeleccion('Elige un efecto a usar', opciones, (opt) => { if (opt) ejecutarOpcionEfecto(opt); });
  }

  function safeOn(id, eventName, fn) {
    var el = document.getElementById(id);
    if (el) el.addEventListener(eventName, fn);
  }

  function init() {
    if (window.__menuInitDone) return;
    // Programar paso del splash al menú lo antes posible para que no falle si algo más falla
    var splash = document.getElementById('splash-screen');
    if (splash && splash.classList.contains('active')) {
      setTimeout(function () {
        if (!splash.classList.contains('active')) return;
        if (typeof UI !== 'undefined' && UI.mostrarPantalla) {
          UI.mostrarPantalla('menu-screen');
        } else {
          document.querySelectorAll('.screen').forEach(function (el) { el.classList.remove('active'); });
          var menu = document.getElementById('menu-screen');
          if (menu) menu.classList.add('active');
        }
        try { if (typeof actualizarMenuStats === 'function') actualizarMenuStats(); } catch (e) { console.warn('actualizarMenuStats:', e); }
      }, 2200);
    }
    try {
      var btnVsIa = document.getElementById('btn-vs-ia');
      if (btnVsIa) {
        btnVsIa.addEventListener('click', function () {
          var cont = document.getElementById('dificultad-container');
          if (cont) cont.classList.remove('hidden');
          document.querySelectorAll('.diff-btn').forEach(function (b) {
            b.classList.toggle('selected', b.dataset.diff === dificultadPartida);
          });
          var sel = document.getElementById('select-mazo');
          if (sel && typeof getMazosDisponibles === 'function') {
            var mazos = getMazosDisponibles();
            var saved = localStorage.getItem('dioses_mazo') || 'clasico';
            sel.innerHTML = mazos.map(function (m) { return '<option value="' + m.id + '">' + m.nombre + '</option>'; }).join('');
            if (mazos.some(function (m) { return m.id === saved; })) sel.value = saved;
          }
        });
      }
      document.querySelectorAll('.diff-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          dificultadPartida = btn.dataset.diff || 'facil';
          var dc = document.getElementById('dificultad-container');
          if (dc) dc.classList.add('hidden');
          empezarPartida('ia', dificultadPartida);
        });
      });
      safeOn('btn-cancelar-dificultad', 'click', function () {
        var c = document.getElementById('dificultad-container');
        if (c) c.classList.add('hidden');
      });
      safeOn('btn-vs-local', 'click', function () { empezarPartida('local'); });
      safeOn('btn-campania', 'click', mostrarCampania);
      safeOn('btn-torneo', 'click', empezarTorneo);
      safeOn('btn-survival', 'click', empezarSurvival);
      safeOn('btn-desafios', 'click', mostrarDesafios);
      safeOn('btn-online', 'click', mostrarOnline);
      safeOn('btn-reglas', 'click', mostrarReglas);
      safeOn('btn-logros', 'click', mostrarLogros);
      safeOn('btn-misiones', 'click', mostrarMisiones);
      safeOn('btn-sonido', 'click', mostrarSonido);
      safeOn('btn-salir', 'click', function () { window.close(); });
      safeOn('cerrar-campania', 'click', function () { var m = document.getElementById('campania-modal'); if (m) m.classList.add('hidden'); });
      safeOn('cerrar-desafios', 'click', function () { var m = document.getElementById('desafios-modal'); if (m) m.classList.add('hidden'); });
      safeOn('cerrar-online', 'click', cerrarOnline);
      safeOn('cerrar-reglas', 'click', function () { var m = document.getElementById('reglas-modal'); if (m) m.classList.add('hidden'); });
      safeOn('cerrar-logros', 'click', function () { var m = document.getElementById('logros-modal'); if (m) m.classList.add('hidden'); });
      safeOn('cerrar-misiones', 'click', function () { var m = document.getElementById('misiones-modal'); if (m) m.classList.add('hidden'); });
      safeOn('cerrar-sonido', 'click', function () { var m = document.getElementById('sonido-modal'); if (m) m.classList.add('hidden'); });
      var sonidoMus = document.getElementById('sonido-musica');
      var sonidoEff = document.getElementById('sonido-efectos');
      if (sonidoMus) sonidoMus.addEventListener('change', function () { if (typeof Sounds !== 'undefined') Sounds.setMusicaEnabled(this.checked); });
      if (sonidoEff) sonidoEff.addEventListener('change', function () { if (typeof Sounds !== 'undefined') Sounds.setEffectsEnabled(this.checked); });
      safeOn('btn-confirmar-setup', 'click', confirmarSetup);
      safeOn('btn-poner-energia', 'click', modoPonerEnergia);
      safeOn('btn-poner-soporte', 'click', modoPonerSoporte);
      safeOn('btn-poner-boca-abajo', 'click', modoPonerBocaAbajo);
      safeOn('btn-atacar', 'click', iniciarAtaque);
      safeOn('btn-usar-efecto', 'click', usarEfectoClick);
      safeOn('btn-pasar', 'click', pasarTurno);
      safeOn('btn-end-turn', 'click', terminarTurno);
      safeOn('btn-rendirse', 'click', rendirse);
      safeOn('selection-cancel', 'click', function () { var m = document.getElementById('selection-modal'); if (m) m.classList.add('hidden'); });
      safeOn('btn-volver-menu', 'click', function () { if (typeof Sounds !== 'undefined' && Sounds.musica) Sounds.musica(false); volverMenuTrasPartida(); });
      safeOn('btn-volver-setup', 'click', function () { 
        // Ocultar overlay
        const overlay = document.getElementById('setup-overlay');
        if (overlay) overlay.classList.add('hidden');
        // Limpiar setup
        if (typeof UI !== 'undefined' && UI.limpiarSetupTargets) {
          UI.limpiarSetupTargets();
        }
        // Restaurar opacidad
        const rivalZone = document.getElementById('rival-zone');
        const centerZone = document.querySelector('.center-zone');
        const chatPanel = document.querySelector('.game-chat-panel');
        if (rivalZone) rivalZone.style.opacity = '';
        if (centerZone) centerZone.style.opacity = '';
        if (chatPanel) chatPanel.style.opacity = '';
        // Volver al menú
        if (typeof UI !== 'undefined' && UI.mostrarMenu) UI.mostrarMenu();
        if (typeof actualizarMenuStats === 'function') actualizarMenuStats();
      });
      safeOn('btn-cancelar-accion', 'click', cancelarModoInteractivo);
      safeOn('btn-sugerir', 'click', sugerirJugada);
      var gameScreen = document.getElementById('game-screen');
      if (gameScreen) {
        gameScreen.addEventListener('click', onTableroClick);
        gameScreen.addEventListener('dragstart', onGameDragStart);
        gameScreen.addEventListener('dragend', onGameDragEnd);
        gameScreen.addEventListener('dragover', onGameDragOver);
        gameScreen.addEventListener('drop', onGameDrop);
        gameScreen.addEventListener('touchstart', onGameTouchStart, { passive: true });
        gameScreen.addEventListener('touchend', onGameTouchEnd, { passive: false });
        gameScreen.addEventListener('touchcancel', onGameTouchCancel, { passive: true });
      }
      var handScroll = document.getElementById('player-hand-scroll');
      var handLeft = document.getElementById('hand-scroll-left');
      var handRight = document.getElementById('hand-scroll-right');
      if (handScroll && handLeft && handRight) {
        var scrollStep = 90;
        handLeft.addEventListener('click', function () {
          handScroll.scrollBy({ left: -scrollStep, behavior: 'smooth' });
          setTimeout(actualizarBotonesMano, 100);
        });
        handRight.addEventListener('click', function () {
          handScroll.scrollBy({ left: scrollStep, behavior: 'smooth' });
          setTimeout(actualizarBotonesMano, 100);
        });
        handScroll.addEventListener('scroll', actualizarBotonesMano);
        handScroll.addEventListener('tableroActualizado', actualizarBotonesMano);
        setTimeout(actualizarBotonesMano, 200);
      }
      var rivalHandScroll = document.getElementById('rival-hand-scroll');
      var rivalHandLeft = document.getElementById('rival-hand-scroll-left');
      var rivalHandRight = document.getElementById('rival-hand-scroll-right');
      if (rivalHandScroll && rivalHandLeft && rivalHandRight) {
        var scrollStepRival = 90;
        rivalHandLeft.addEventListener('click', function () {
          rivalHandScroll.scrollBy({ left: -scrollStepRival, behavior: 'smooth' });
          setTimeout(actualizarBotonesManoRival, 100);
        });
        rivalHandRight.addEventListener('click', function () {
          rivalHandScroll.scrollBy({ left: scrollStepRival, behavior: 'smooth' });
          setTimeout(actualizarBotonesManoRival, 100);
        });
        rivalHandScroll.addEventListener('scroll', actualizarBotonesManoRival);
        rivalHandScroll.addEventListener('tableroActualizado', actualizarBotonesManoRival);
        setTimeout(actualizarBotonesManoRival, 200);
      }
      cargarTextoReglas();
      try { if (typeof actualizarMenuStats === 'function') actualizarMenuStats(); } catch (e) { console.warn('actualizarMenuStats:', e); }
      UI.afterRender = function () {
        var s = Game.estado;
        if (s && s.turnoActual === 'player' && s.accionesRestantes === 0 && !s.ganador && s.fase === 'acciones') {
          setTimeout(terminarTurno, 500);
        }
      };
      window.__menuInitDone = true;
    } catch (err) {
      console.error('Error en init():', err);
    }
  }

  function actualizarBotonesMano() {
    const el = document.getElementById('player-hand-scroll');
    const left = document.getElementById('hand-scroll-left');
    const right = document.getElementById('hand-scroll-right');
    if (!el || !left || !right) return;
    const tol = 4;
    left.disabled = el.scrollLeft <= tol;
    right.disabled = el.scrollLeft >= el.scrollWidth - el.clientWidth - tol;
  }

  function actualizarBotonesManoRival() {
    const el = document.getElementById('rival-hand-scroll');
    const left = document.getElementById('rival-hand-scroll-left');
    const right = document.getElementById('rival-hand-scroll-right');
    if (!el || !left || !right) return;
    const tol = 4;
    left.disabled = el.scrollLeft <= tol;
    right.disabled = el.scrollLeft >= el.scrollWidth - el.clientWidth - tol;
  }

  let dragHandIndex = null;
  var touchHandIndex = null;

  function onGameDragStart(e) {
    const slot = e.target.closest('.hand-slot');
    if (!slot || slot.dataset.index === undefined) return;
    const s = Game.estado;
    if (!s || s.turnoActual !== 'player' || s.ganador) return;
    const idx = parseInt(slot.dataset.index, 10);
    const carta = s.player.mano[idx];
    if (!carta) return;
    e.dataTransfer.setData('text/plain', String(idx));
    e.dataTransfer.effectAllowed = 'move';
    dragHandIndex = idx;
    slot.classList.add('card-dragging');
  }

  function onGameDragEnd(e) {
    document.querySelectorAll('.hand-slot').forEach(el => el.classList.remove('card-dragging'));
    document.querySelectorAll('.hero-slot').forEach(el => el.classList.remove('drop-target-active'));
    document.querySelectorAll('.hidden-slot').forEach(el => el.classList.remove('drop-target-active'));
    dragHandIndex = null;
  }

  function onGameDragOver(e) {
    document.querySelectorAll('.hero-slot').forEach(el => el.classList.remove('drop-target-active'));
    document.querySelectorAll('.hidden-slot').forEach(el => el.classList.remove('drop-target-active'));
    if (dragHandIndex == null) return;
    const s = Game.estado;
    if (!s) return;
    const carta = s.player.mano[dragHandIndex];
    if (!carta) return;
    const supportSlot = e.target.closest('.hidden-slot[data-player="player"]');
    if (supportSlot && supportSlot.dataset.slot !== undefined) {
      const slotIdx = parseInt(supportSlot.dataset.slot, 10);
      const bocaAbajo = s.player.bocaAbajo || [];
      if (!bocaAbajo[slotIdx]) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        supportSlot.classList.add('drop-target-active');
        return;
      }
    }
    if (carta.tipo === 'energia') {
      const heroSlot = e.target.closest('.hero-slot[data-player="player"]');
      if (!heroSlot || heroSlot.classList.contains('vacio')) return;
      const slotIdx = parseInt(heroSlot.dataset.slot, 10);
      const heroe = s.player.heroes[slotIdx];
      if (!heroe || heroe.vida <= 0) return;
      if ((heroe.energiaStack && heroe.energiaStack.length >= 3)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      heroSlot.classList.add('drop-target-active');
    }
  }

  function onGameDrop(e) {
    e.preventDefault();
    document.querySelectorAll('.hero-slot').forEach(el => el.classList.remove('drop-target-active'));
    document.querySelectorAll('.hidden-slot').forEach(el => el.classList.remove('drop-target-active'));
    if (dragHandIndex == null) return;
    const s = Game.estado;
    if (!s) { dragHandIndex = null; return; }
    const supportSlot = e.target.closest('.hidden-slot[data-player="player"]');
    if (supportSlot && supportSlot.dataset.slot !== undefined) {
      const slotIdx = parseInt(supportSlot.dataset.slot, 10);
      const result = Game.ponerEnSoporteDesdeMano('player', dragHandIndex, slotIdx);
      if (result.ok) {
        if (modoPartida === 'online' && typeof Online !== 'undefined') Online.enviarAccion({ tipo: 'soporte', indiceMano: dragHandIndex, slotSoporte: slotIdx });
        if (typeof Sounds !== 'undefined' && Sounds.ponerEnergia) Sounds.ponerEnergia();
        cancelarModoInteractivo();
        UI.renderizarTablero();
      }
      dragHandIndex = null;
      return;
    }
    const heroSlot = e.target.closest('.hero-slot[data-player="player"]');
    if (!heroSlot) { dragHandIndex = null; return; }
    const carta = s.player.mano[dragHandIndex];
    if (carta && carta.tipo === 'energia') {
      const slotIdx = parseInt(heroSlot.dataset.slot, 10);
      aplicarPonerEnergia(dragHandIndex, slotIdx);
    }
    dragHandIndex = null;
  }

  function aplicarPonerEnergia(indiceMano, slotIdx) {
    const result = Game.ponerEnergia('player', indiceMano, slotIdx);
    if (result.ok && modoPartida === 'online' && typeof Online !== 'undefined') Online.enviarAccion({ tipo: 'energia', indiceMano: indiceMano, heroeSlot: slotIdx });
    if (result.ok) {
      if (typeof Sounds !== 'undefined') { Sounds.robar(); if (Sounds.ponerEnergia) Sounds.ponerEnergia(); }
      cancelarModoInteractivo();
      UI.renderizarTablero();
      var slotEl = document.querySelector('#player-zone .hero-slot[data-slot="' + slotIdx + '"]');
      if (slotEl) UI.animarEnergiaPuesta(slotEl);
    }
  }

  function onGameTouchStart(e) {
    if (e.touches.length !== 1) return;
    var slot = e.target.closest('.hand-slot');
    if (!slot || slot.dataset.index === undefined) return;
    var s = Game.estado;
    if (!s || s.turnoActual !== 'player' || s.ganador) return;
    var idx = parseInt(slot.dataset.index, 10);
    var carta = s.player.mano[idx];
    if (!carta) return;
    touchHandIndex = idx;
    slot.classList.add('card-dragging');
  }

  function onGameTouchEnd(e) {
    if (e.changedTouches.length !== 1) { touchHandIndex = null; return; }
    document.querySelectorAll('.hand-slot').forEach(function (el) { el.classList.remove('card-dragging'); });
    if (touchHandIndex == null) return;
    var t = e.changedTouches[0];
    var el = document.elementFromPoint(t.clientX, t.clientY);
    var st = Game.estado;
    if (st) {
      var carta = st.player.mano[touchHandIndex];
      var supportSlot = el && el.closest('.hidden-slot[data-player="player"]');
      if (supportSlot && supportSlot.dataset.slot !== undefined && carta) {
        var slotIdx = parseInt(supportSlot.dataset.slot, 10);
        var bocaAbajo = st.player.bocaAbajo || [];
        if (!bocaAbajo[slotIdx]) {
          var result = Game.ponerEnSoporteDesdeMano('player', touchHandIndex, slotIdx);
          if (result.ok) {
            if (modoPartida === 'online' && typeof Online !== 'undefined') Online.enviarAccion({ tipo: 'soporte', indiceMano: touchHandIndex, slotSoporte: slotIdx });
            if (typeof Sounds !== 'undefined' && Sounds.ponerEnergia) Sounds.ponerEnergia();
            cancelarModoInteractivo();
            UI.renderizarTablero();
          }
          touchHandIndex = null;
          return;
        }
      }
      if (carta && carta.tipo === 'energia') {
        var heroSlot = el && el.closest('.hero-slot[data-player="player"]');
        if (heroSlot && !heroSlot.classList.contains('vacio')) {
          var slotIdx = parseInt(heroSlot.dataset.slot, 10);
          var heroe = st.player.heroes[slotIdx];
          if (heroe && heroe.vida > 0 && (!heroe.energiaStack || heroe.energiaStack.length < 3)) {
            e.preventDefault();
            aplicarPonerEnergia(touchHandIndex, slotIdx);
          }
        }
      }
    }
    touchHandIndex = null;
  }

  function onGameTouchCancel() {
    touchHandIndex = null;
    document.querySelectorAll('.hand-slot').forEach(function (el) { el.classList.remove('card-dragging'); });
  }

  function onTableroClick(e) {
    const s = Game.estado;
    if (!s || s.ganador) return;
    if (s.turnoActual !== 'player') return;

    // Clic en carta de trampa (mano o soporte) para usar efecto sin abrir el modal
    if (!modoInteractivo && s.accionesRestantes >= 1) {
      const handSlot = e.target.closest('.hand-slot');
      if (handSlot && handSlot.closest('#player-zone')) {
        const idx = parseInt(handSlot.dataset.index ?? handSlot.dataset.slot, 10);
        if (!isNaN(idx)) {
          const carta = s.player.mano[idx];
          if (carta && carta.tipo === 'trampa' && efectosDesdeMano.includes(carta.efectoId || carta.id)) {
            ejecutarOpcionEfecto({ tipo: 'mano', indiceMano: idx, efectoId: carta.efectoId || carta.id, nombre: carta.nombre || carta.id });
            return;
          }
        }
      }
      const hiddenSlot = e.target.closest('.hidden-slot');
      if (hiddenSlot && hiddenSlot.dataset.player === 'player' && hiddenSlot.dataset.slot !== undefined) {
        const slot = parseInt(hiddenSlot.dataset.slot, 10);
        const carta = (s.player.bocaAbajo || [])[slot];
        if (carta && carta.tipo === 'trampa') {
          ejecutarOpcionEfecto({ tipo: 'boca_abajo', slot: slot, efectoId: carta.efectoId || carta.id, nombre: carta.nombre || carta.id });
          return;
        }
      }
    }

    if (!modoInteractivo) return;

    const handSlot = e.target.closest('.hand-slot');
    const heroSlot = e.target.closest('.hero-slot');
    const hiddenSlot = e.target.closest('.hidden-slot');
    if (handSlot && handSlot.dataset.index !== undefined && modoInteractivo.tipo === 'energia' && modoInteractivo.indiceMano === undefined) {
      const idx = parseInt(handSlot.dataset.index, 10);
      const carta = s.player.mano[idx];
      if (carta && carta.tipo === 'energia') {
        modoInteractivo = { tipo: 'energia', indiceMano: idx };
        UI.establecerModoInteractivo(modoInteractivo);
        UI.renderizarTablero();
      }
      return;
    }
    // Atacar carta de soporte del rival
    if (hiddenSlot && hiddenSlot.dataset.player === 'rival' && hiddenSlot.dataset.slot !== undefined && modoInteractivo.tipo === 'atacar' && modoInteractivo.atacanteSlot !== undefined) {
      const slotSoporte = parseInt(hiddenSlot.dataset.slot, 10);
      const heroeAtacante = s.player.heroes[modoInteractivo.atacanteSlot];
      const energiaDisponible = (heroeAtacante && heroeAtacante.energiaStack && heroeAtacante.energiaStack.length) || 0;
      if (energiaDisponible >= 1) {
        const result = Game.atacarSoporte('player', modoInteractivo.atacanteSlot, slotSoporte);
        if (result.ok) {
          if (modoPartida === 'online' && typeof Online !== 'undefined') {
            Online.enviarAccion({ tipo: 'atacar_soporte', atacanteSlot: modoInteractivo.atacanteSlot, slotSoporte });
          }
          if (typeof GameLog !== 'undefined' && result.cartaNombre) {
            GameLog.addSystem(`${result.atacanteNombre || 'Héroe'} ha destruido la carta de soporte <strong>${result.cartaNombre}</strong> ⚔️`);
          }
          cancelarModoInteractivo();
          UI.renderizarTablero();
          comprobarGanador();
        }
      }
      return;
    }
    if (handSlot && handSlot.dataset.index !== undefined && modoInteractivo.tipo === 'soporte' && modoInteractivo.indiceMano === undefined) {
      const idx = parseInt(handSlot.dataset.index, 10);
      const carta = s.player.mano[idx];
      if (carta) {
        modoInteractivo = { tipo: 'soporte', indiceMano: idx };
        UI.establecerModoInteractivo(modoInteractivo);
        UI.renderizarTablero();
      }
      return;
    }
    if (hiddenSlot && hiddenSlot.dataset.player === 'player' && hiddenSlot.dataset.slot !== undefined && modoInteractivo.tipo === 'soporte' && modoInteractivo.indiceMano !== undefined) {
      const slotIndex = parseInt(hiddenSlot.dataset.slot, 10);
      const result = Game.ponerEnSoporteDesdeMano('player', modoInteractivo.indiceMano, slotIndex);
      if (result.ok) {
        if (typeof Sounds !== 'undefined' && Sounds.ponerEnergia) Sounds.ponerEnergia();
        cancelarModoInteractivo();
        UI.renderizarTablero();
      }
      return;
    }
    if (heroSlot && heroSlot.dataset.player !== undefined && heroSlot.dataset.slot !== undefined) {
      const slotIndex = parseInt(heroSlot.dataset.slot, 10);
      const zonePlayer = heroSlot.dataset.player;
      if (modoInteractivo.tipo === 'energia' && modoInteractivo.indiceMano !== undefined && zonePlayer === 'player') {
        const result = Game.ponerEnergia('player', modoInteractivo.indiceMano, slotIndex);
        if (result.ok) {
          if (modoPartida === 'online' && typeof Online !== 'undefined') Online.enviarAccion({ tipo: 'energia', indiceMano: modoInteractivo.indiceMano, heroeSlot: slotIndex });
          if (typeof Sounds !== 'undefined') { Sounds.robar(); if (Sounds.ponerEnergia) Sounds.ponerEnergia(); }
          cancelarModoInteractivo();
          UI.renderizarTablero();
          const slotEl = document.querySelector('#player-zone .hero-slot[data-slot="' + slotIndex + '"]');
          UI.animarEnergiaPuesta(slotEl);
        }
        return;
      }
      if (modoInteractivo.tipo === 'atacar') {
        if (modoInteractivo.atacanteSlot === undefined && zonePlayer === 'player' && Game.puedeAtacar('player', slotIndex)) {
          modoInteractivo = { tipo: 'atacar', atacanteSlot: slotIndex };
          UI.establecerModoInteractivo(modoInteractivo);
          UI.renderizarTablero();
          return;
        }
        if (modoInteractivo.atacanteSlot !== undefined && zonePlayer === 'rival') {
          const result = Game.atacar('player', modoInteractivo.atacanteSlot, slotIndex);
          if (!result.ok) return;
          if (modoPartida === 'online' && typeof Online !== 'undefined') Online.enviarAccion({ tipo: 'atacar', atacanteSlot: modoInteractivo.atacanteSlot, defensorSlot: slotIndex });
          if (typeof Progresion !== 'undefined' && Progresion.registrarAccion) {
            const atacante = s.player.heroes[modoInteractivo.atacanteSlot];
            if (atacante && atacante.id) Progresion.registrarAccion('atacar', { heroeId: atacante.id });
          }
          if (typeof GameLog !== 'undefined' && result.atacanteNombre) {
            if (result.bloqueado) GameLog.addBlockedDamage(result.atacanteJugador, result.atacanteNombre, result.defensorNombre, result.danoBloqueado);
            else if (result.dano != null) GameLog.addDamage(result.atacanteJugador, result.atacanteNombre, result.defensorNombre, result.dano);
          }
          if (result.curacion != null && typeof GameLog !== 'undefined') GameLog.addHeal(result.jugadorCurado, result.heroeNombre, result.curacion);
          // Agregar efectos especiales al log
          if (result.efectoEspecial && typeof GameLog !== 'undefined') {
            const efecto = result.efectoEspecial;
            const jugador = result.atacanteJugador || 'player';
            const nombreAtacante = result.atacanteNombre || 'Héroe';
            if (efecto.tipo === 'paralizar') {
              GameLog.addSpecialEffect(jugador, nombreAtacante, `ha paralizado a ${efecto.heroe} por ${efecto.turnos} turno(s)`);
            } else if (efecto.tipo === 'electrocutar') {
              GameLog.addSpecialEffect(jugador, nombreAtacante, `ha electrocutado a ${efecto.heroe} por ${efecto.turnos} turnos`);
            } else if (efecto.tipo === 'quemar_carta') {
              GameLog.addSpecialEffect(jugador, nombreAtacante, 'puede quemar una carta del rival');
            } else if (efecto.tipo === 'destruir_energia') {
              GameLog.addSpecialEffect(jugador, nombreAtacante, `ha destruido 1 energía de ${efecto.heroe}`);
            } else if (efecto.tipo === 'robar_carta') {
              GameLog.addSpecialEffect(jugador, nombreAtacante, `ha robado ${efecto.cantidad} carta(s) del mazo`);
            } else if (efecto.tipo === 'fenix_revivir') {
              GameLog.addSpecialEffect('rival', efecto.heroe, 'ha revivido y vuelto a la batalla');
            }
          }
          const atacanteEl = document.querySelector('#player-zone .hero-slot[data-slot="' + modoInteractivo.atacanteSlot + '"]');
          const defensorEl = document.querySelector('#rival-zone .hero-slot[data-slot="' + slotIndex + '"]');
          if (typeof Sounds !== 'undefined' && Sounds.atacar) Sounds.atacar();
          UI.animarAtaque(atacanteEl, defensorEl, () => {
            function rest() {
              const oponente = 'rival';
              if (result.luciferQuemar && s[oponente].mano.length > 0) {
                UI.pedirQuemarCartaRival(oponente, (idx) => {
                  if (idx != null) Game.quemarCartaDe(oponente, idx);
                  cancelarModoInteractivo();
                  UI.renderizarTablero();
                  comprobarGanador();
                });
              } else {
                cancelarModoInteractivo();
                UI.renderizarTablero();
                comprobarGanador();
              }
            }
            // Mostrar mensaje de héroe asesinado primero; si además hay Lucifer, esperar a que se cierre antes del modal
            const hayMensajeKill = result.defensorDestruido || result.atacanteDestruido;
            if (result.defensorDestruido) {
              UI.mostrarMensajeHeroeAsesinado('enemigo');
              if (typeof GameLog !== 'undefined') {
                GameLog.addSystem(`<strong>${result.defensorNombre || 'Héroe enemigo'}</strong> ha sido eliminado ⚔️`);
              }
            }
            if (result.atacanteDestruido) {
              UI.mostrarMensajeHeroeAsesinado('aliado');
              if (typeof GameLog !== 'undefined') {
                GameLog.addSystem(`<strong>${result.atacanteNombre || 'Héroe aliado'}</strong> ha sido eliminado 💀`);
              }
            }
            if (result.curacion != null) UI.animarCuracion(defensorEl, rest);
            else if (result.cartaRevelada) UI.animarTrampa(defensorEl, rest);
            else if (hayMensajeKill && result.luciferQuemar) {
              // Esperar a que desaparezca "Enemigo Asesinado" (3s) y luego mostrar modal de Lucifer
              setTimeout(rest, 3200);
            } else {
              rest();
            }
          });
        }
      }
    }
  }

  function cargarTextoReglas() {
    const el = document.querySelector('#reglas-modal .reglas-texto');
    if (!el) return;
    el.innerHTML = `
      <p><strong>Objetivo:</strong> Gana el jugador que deja al rival sin héroes en el mazo. Cuando el rival debe reemplazar un héroe destruido y no queda ninguno en el mazo, pierde.</p>
      <p><strong>Mazo compartido:</strong> Ambos roban del mismo mazo. Al inicio cada uno roba 8 cartas y coloca 2 héroes en campo, 3 boca abajo y 3 en mano.</p>
      <p><strong>Turno:</strong> Tienes 2 acciones por turno. Puedes: poner 1 carta de energía (boca abajo), atacar con un héroe (gastando su costo en energía), usar un efecto (curación, robo, etc.). Después de tus acciones, robas hasta tener 3 cartas en mano.</p>
      <p><strong>Energía:</strong> Las cartas de energía se ponen boca abajo. Para atacar con un héroe debes tener al menos tantas cartas de energía como su costo (1, 2 o 3). Al atacar, se gastan esas cartas (van al descarte).</p>
      <p><strong>Héroes:</strong> Tienen ataque y vida. Si la vida llega a 0, el héroe se destruye y debe reemplazarse por otro de la mano o robando del mazo hasta encontrar uno.</p>
      <p><strong>Sin héroes en el mazo:</strong> Si al reemplazar un héroe no queda ninguno en el mazo, ese jugador pierde.</p>
    `;
  }

  function mostrarReglas() {
    document.getElementById('reglas-modal').classList.remove('hidden');
  }

  function mostrarLogros() {
    if (typeof Progresion === 'undefined') return;
    Progresion.cargar();
    const lista = Progresion.getLogros();
    const el = document.getElementById('logros-lista');
    if (!el) return;
    el.innerHTML = lista.map(l => {
      const clase = l.desbloqueado ? '' : ' bloqueado';
      return `<div class="logro-item${clase}"><h4>${l.desbloqueado ? '✓ ' : ''}${l.nombre}</h4><p>${l.descripcion}</p></div>`;
    }).join('');
    document.getElementById('logros-modal').classList.remove('hidden');
  }

  function mostrarSonido() {
    if (typeof Sounds === 'undefined') return;
    Sounds.init();
    const mus = document.getElementById('sonido-musica');
    const eff = document.getElementById('sonido-efectos');
    if (mus) mus.checked = Sounds.musicaEnabled;
    if (eff) eff.checked = Sounds.effectsEnabled;
    document.getElementById('sonido-modal').classList.remove('hidden');
  }

  function mostrarMisiones() {
    if (typeof Progresion === 'undefined') return;
    Progresion.cargar();
    const lista = Progresion.getMisionesDiarias();
    const el = document.getElementById('misiones-lista');
    if (!el) return;
    el.innerHTML = lista.map(m => {
      const pct = Math.min(100, (m.progreso / m.meta) * 100);
      return `<div class="mision-item"><h4>${m.nombre}</h4><p>${m.progreso} / ${m.meta}</p><div class="progreso-bar"><div class="progreso-fill" style="width:${pct}%"></div></div></div>`;
    }).join('');
    document.getElementById('misiones-modal').classList.remove('hidden');
  }

  function notificarProgresion(resultado) {
    if (!resultado) return;
    /* Los logros y misiones se guardan en Progresion; no se muestra popup de logro. */
  }

  function actualizarMenuStats() {
    if (typeof Progresion === 'undefined') return;
    try {
      Progresion.cargar();
      const logros = Progresion.getLogros ? Progresion.getLogros() : [];
      const nLogros = Array.isArray(logros) ? logros.filter(l => l && l.desbloqueado).length : 0;
      const elLogros = document.getElementById('menu-logros-count');
      const elRend = document.getElementById('menu-rendiciones-count');
      if (elLogros) elLogros.textContent = 'Logros: ' + nLogros + '/' + (logros.length || 0);
      if (elRend) elRend.textContent = 'Rendiciones: ' + (Progresion.estado && Progresion.estado.rendiciones || 0);
    } catch (e) { console.warn('actualizarMenuStats:', e); }
  }

  function volverMenuTrasPartida() {
    document.getElementById('gameover-modal').classList.add('hidden');
    const cfg = typeof TORNEO_CONFIG !== 'undefined' ? TORNEO_CONFIG : { rondas: 3, dificultadesPorRonda: ['facil', 'intermedio', 'jarcor'] };
    if (modoPartida === 'torneo' && ultimoGanadorPartida === 'player' && torneoRonda < cfg.rondas - 1) {
      torneoRonda++;
      empezarPartida('torneo', cfg.dificultadesPorRonda[torneoRonda] || 'jarcor', { rondaTorneo: torneoRonda });
      return;
    }
    if (modoPartida === 'survival' && ultimoGanadorPartida === 'player') {
      olaSurvivalActual++;
      empezarPartida('survival', 'intermedio', { olaSurvival: olaSurvivalActual });
      return;
    }
    if (modoPartida === 'campania' && ultimoGanadorPartida === 'player') {
      mostrarCampania();
      return;
    }
    if (typeof Sounds !== 'undefined' && Sounds.musica) Sounds.musica(false);
    UI.mostrarMenu();
    if (typeof actualizarMenuStats === 'function') actualizarMenuStats();
  }

  function mostrarCampania() {
    if (typeof NIVELES_CAMPANIA === 'undefined') return;
    const maxNivel = typeof Progresion !== 'undefined' && Progresion.estado ? Progresion.estado.nivelCampaniaDesbloqueado || 0 : 0;
    const el = document.getElementById('campania-niveles');
    const texto = document.getElementById('campania-texto');
    if (texto) texto.textContent = 'Elige un nivel. Gana para desbloquear el siguiente.';
    if (el) {
      el.innerHTML = NIVELES_CAMPANIA.map(n => {
        const desbloqueado = n.id <= maxNivel;
        return '<button type="button" class="campania-nivel-btn' + (desbloqueado ? '' : ' bloqueado') + '" data-nivel="' + n.id + '">' + n.titulo + ' (' + (n.dificultadIA || 'facil') + ')' + (desbloqueado ? '' : ' [bloqueado]') + '</button>';
      }).join('');
      el.querySelectorAll('.campania-nivel-btn').forEach(btn => {
        if (btn.classList.contains('bloqueado')) return;
        btn.addEventListener('click', () => {
          document.getElementById('campania-modal').classList.add('hidden');
          const n = NIVELES_CAMPANIA[parseInt(btn.dataset.nivel, 10)];
          if (n) empezarPartida('campania', n.dificultadIA, { nivelCampania: n.id });
        });
      });
    }
    document.getElementById('campania-modal').classList.remove('hidden');
  }

  function empezarTorneo() {
    const cfg = typeof TORNEO_CONFIG !== 'undefined' ? TORNEO_CONFIG : { rondas: 3, dificultadesPorRonda: ['facil', 'intermedio', 'jarcor'] };
    torneoRonda = 0;
    torneoGanadas = 0;
    empezarPartida('torneo', cfg.dificultadesPorRonda[0], { rondaTorneo: 0 });
  }

  function empezarSurvival() {
    olaSurvivalActual = 1;
    empezarPartida('survival', 'intermedio', { olaSurvival: 1 });
  }

  function mostrarOnline() {
    document.getElementById('online-modal').classList.remove('hidden');
    document.getElementById('online-form').classList.remove('hidden');
    document.getElementById('online-sala-creada').classList.add('hidden');
    document.getElementById('online-codigo-wrap').classList.add('hidden');
    document.getElementById('online-status').textContent = 'Crea una sala o únete con un código.';
    if (typeof Online !== 'undefined') {
      Online.onMensaje = (m) => {
        if (m.tipo === 'sala_creada') {
          document.getElementById('online-form').classList.add('hidden');
          document.getElementById('online-sala-creada').classList.remove('hidden');
          document.getElementById('online-codigo-mostrar').textContent = m.codigo || Online.codigoSala || '-';
        }
        if (m.tipo === 'error') document.getElementById('online-status').textContent = m.texto || 'Error';
        if (m.tipo === 'mano_inicial' && m.manoInicial && typeof Game !== 'undefined') {
          Game.iniciar('online', 'facil', {});
          Game.estado.setupPlayer.manoInicial = m.manoInicial;
          document.getElementById('online-modal').classList.add('hidden');
          modoPartida = 'online';
          setupFase = null;
          const setupPlayer = autoSetup(m.manoInicial);
          Game.aplicarSetupJugador(setupPlayer.heroes, setupPlayer.bocaAbajo, setupPlayer.mano);
          Online.enviarSetup(setupPlayer.heroes, setupPlayer.bocaAbajo, setupPlayer.mano);
          UI.mostrarPantalla('game-screen');
          if (typeof GameLog !== 'undefined') GameLog.clear();
          if (typeof Sounds !== 'undefined' && Sounds.musica) Sounds.musica(true);
          UI.renderizarTablero();
        }
      };
      Online.onEstado = () => {
        if (document.getElementById('setup-screen') && !document.getElementById('setup-screen').classList.contains('hidden')) UI.mostrarPantalla('game-screen');
        if (typeof UI !== 'undefined') UI.renderizarTablero();
      };
      Online.onDesconectar = () => { document.getElementById('online-status').textContent = 'Desconectado.'; };
    }
    document.getElementById('online-crear').onclick = () => {
      const nick = (document.getElementById('online-nick') || {}).value || 'Jugador';
      if (typeof Online === 'undefined') { document.getElementById('online-status').textContent = 'Módulo online no cargado.'; return; }
      document.getElementById('online-status').textContent = 'Conectando...';
      Online.conectar().then(() => {
        Online.crearSala(nick);
      }).catch(() => {
        document.getElementById('online-status').textContent = 'Servidor no disponible. Añade un backend WebSocket para jugar online.';
      });
    };
    document.getElementById('online-unir').onclick = () => {
      const wrap = document.getElementById('online-codigo-wrap');
      if (wrap.classList.contains('hidden')) { wrap.classList.remove('hidden'); return; }
      const codigo = (document.getElementById('online-codigo') || {}).value;
      const nick = (document.getElementById('online-nick') || {}).value || 'Jugador';
      if (!codigo) { document.getElementById('online-status').textContent = 'Escribe el código de la sala.'; return; }
      document.getElementById('online-status').textContent = 'Conectando...';
      if (typeof Online === 'undefined') { document.getElementById('online-status').textContent = 'Módulo online no cargado.'; return; }
      Online.conectar().then(() => {
        Online.unirSala(codigo, nick);
      }).catch(() => {
        document.getElementById('online-status').textContent = 'Servidor no disponible.';
      });
    };
  }

  function cerrarOnline() {
    document.getElementById('online-modal').classList.add('hidden');
    if (typeof Online !== 'undefined') Online.desconectar();
  }

  function mostrarDesafios() {
    if (typeof DESAFIOS === 'undefined') return;
    const el = document.getElementById('desafios-lista');
    if (el) {
      el.innerHTML = DESAFIOS.map(d => '<div class="desafio-item" data-id="' + d.id + '"><h4>' + d.nombre + '</h4><p>' + (d.descripcion || '') + '</p></div>').join('');
      el.querySelectorAll('.desafio-item').forEach(item => {
        item.addEventListener('click', () => {
          const d = DESAFIOS.find(x => x.id === item.dataset.id);
          if (d) {
            document.getElementById('desafios-modal').classList.add('hidden');
            empezarPartida('desafio', 'intermedio', { reglasDesafio: d.reglasDesafio, desafioId: d.id });
          }
        });
      });
    }
    document.getElementById('desafios-modal').classList.remove('hidden');
  }

  /**
   * Reparte automáticamente 8 cartas en 2 héroes, 3 soporte y 3 en mano (sin pantalla de configuración).
   */
  function autoSetup(manoInicial) {
    if (typeof IA !== 'undefined' && IA.elegirSetup) return IA.elegirSetup(manoInicial);
    const heroes = [], bocaAbajo = [], mano = [];
    const restantes = [...manoInicial];
    const esHeroe = c => c && c.tipo === 'heroe';
    const heroesDisponibles = restantes.filter(esHeroe);
    const noHeroes = restantes.filter(c => !esHeroe(c));
    for (let i = 0; i < 2 && i < heroesDisponibles.length; i++) heroes.push(heroesDisponibles[i]);
    const restantesTrasHeroes = [...noHeroes, ...heroesDisponibles.slice(2)];
    for (let i = 0; i < 3 && i < restantesTrasHeroes.length; i++) bocaAbajo.push(restantesTrasHeroes[i]);
    for (let i = 3; i < 6 && i < restantesTrasHeroes.length; i++) mano.push(restantesTrasHeroes[i]);
    return { heroes, bocaAbajo, mano };
  }

  function empezarPartida(modo, dificultad = 'facil', opciones) {
    if (typeof Game === 'undefined' || !Game.iniciar) {
      console.error('Game no cargado. Comprueba que game.js y cartas.js estén cargados.');
      alert('Error: no se pudo cargar el juego. Recarga la página.');
      return;
    }
    if (typeof UI === 'undefined') {
      console.error('UI no cargado. Comprueba que ui.js esté cargado.');
      alert('Error: no se pudo cargar la interfaz. Recarga la página.');
      return;
    }
    modoPartida = modo;
    dificultadPartida = dificultad || 'facil';
    if (typeof IA !== 'undefined') IA.dificultad = dificultadPartida;
    opciones = opciones || {};
    if (modo === 'ia' && !opciones.idMazo) {
      const sel = document.getElementById('select-mazo');
      if (sel) {
        opciones.idMazo = sel.value || 'clasico';
        try { localStorage.setItem('dioses_mazo', opciones.idMazo); } catch (e) {}
      }
    }
    Game.iniciar(modo, dificultadPartida, opciones);
    const s = Game.estado;
    setupFase = null;

    // Reparto automático: sin pantalla de configuración, directo al juego
    const setupPlayer = autoSetup(s.setupPlayer.manoInicial);
    Game.aplicarSetupJugador(setupPlayer.heroes, setupPlayer.bocaAbajo, setupPlayer.mano);

    if (modoPartida === 'online' && typeof Online !== 'undefined') {
      Online.enviarSetup(setupPlayer.heroes, setupPlayer.bocaAbajo, setupPlayer.mano);
      document.getElementById('online-modal').classList.add('hidden');
      UI.mostrarPantalla('game-screen');
      if (typeof GameLog !== 'undefined') GameLog.clear();
      if (typeof Sounds !== 'undefined' && Sounds.musica) Sounds.musica(true);
      UI.renderizarTablero();
      return;
    }

    const setupRival = autoSetup(s.setupRival.manoInicial);
    Game.aplicarSetupRival(setupRival.heroes, setupRival.bocaAbajo, setupRival.mano);
    Game.finalizarSetup();
    irAJuegoTrasSetup();
  }

  function irAJuegoTrasSetup() {
    // Ocultar overlay de setup
    const overlay = document.getElementById('setup-overlay');
    if (overlay) overlay.classList.add('hidden');
    
    // Limpiar targets de setup
    if (typeof UI !== 'undefined' && UI.limpiarSetupTargets) {
      UI.limpiarSetupTargets();
    }
    
    // Restaurar opacidad de zonas del tablero (ocultas durante setup)
    const rivalZone = document.getElementById('rival-zone');
    const centerZone = document.querySelector('.center-zone');
    const chatPanel = document.querySelector('.game-chat-panel');
    if (rivalZone) rivalZone.style.opacity = '';
    if (centerZone) centerZone.style.opacity = '';
    if (chatPanel) chatPanel.style.opacity = '';
    
    if (typeof GameLog !== 'undefined') GameLog.clear();
    if (typeof Progresion !== 'undefined') Progresion.iniciarPartida();
    if (typeof Sounds !== 'undefined' && Sounds.musica) Sounds.musica(true);
    UI.mostrarPantalla('game-screen');
    UI.renderizarTablero();
    const st = Game.estado;
    if (st.turnoActual === 'player' && st.turnoPerdido && st.turnoPerdido.player > 0) {
      setTimeout(() => {
        Game.terminarTurno();
        UI.renderizarTablero();
        comprobarGanador();
        if (esModoVsIA() && Game.estado && !Game.estado.ganador) setTimeout(turnoIA, 800);
      }, 1200);
    }
    if (esModoVsIA() && st.turnoActual === 'rival') setTimeout(turnoIA, 600);
  }

  function confirmarSetup() {
    let sel;
    try {
      sel = UI.obtenerSetupSeleccionado();
    } catch (e) {
      console.error('Error al obtener setup:', e);
      alert('Error al leer la configuración. Vuelve a intentarlo.');
      return;
    }
    if (!sel || sel.heroes.length !== 2 || sel.bocaAbajo.length !== 3 || sel.mano.length !== 3) {
      const btnConfirmar = document.getElementById('btn-confirmar-setup');
      if (btnConfirmar && !btnConfirmar.disabled) {
        const originalText = btnConfirmar.textContent;
        btnConfirmar.textContent = 'Completa todas las zonas (2 héroes, 3 soporte, 3 en mano)';
        setTimeout(() => {
          btnConfirmar.textContent = originalText;
        }, 2000);
      }
      return;
    }
    
    const overlay = document.getElementById('setup-overlay');
    if (overlay) overlay.classList.add('hidden');
    
    try {
      if (setupFase === 'player1') {
        Game.aplicarSetupJugador(sel.heroes, sel.bocaAbajo, sel.mano);
        if (modoPartida === 'online' && typeof Online !== 'undefined') {
          Online.enviarSetup(sel.heroes, sel.bocaAbajo, sel.mano);
          return;
        }
        if (esModoVsIA()) {
          if (typeof IA === 'undefined' || typeof IA.elegirSetup !== 'function') {
            alert('Error: el módulo de IA no está cargado. Comprueba que ia.js esté en la carpeta.');
            if (overlay) overlay.classList.remove('hidden');
            return;
          }
          const setupRival = IA.elegirSetup(Game.estado.setupRival.manoInicial);
          Game.aplicarSetupRival(setupRival.heroes, setupRival.bocaAbajo, setupRival.mano);
          Game.finalizarSetup();
          setupFase = null;
          irAJuegoTrasSetup();
        } else {
          setupFase = 'player2';
          UI.mostrarSetup(Game.estado.setupRival.manoInicial, true);
        }
      } else if (setupFase === 'player2') {
        Game.aplicarSetupRival(sel.heroes, sel.bocaAbajo, sel.mano);
        Game.finalizarSetup();
        setupFase = null;
        if (overlay) overlay.classList.add('hidden');
        irAJuegoTrasSetup();
      }
    } catch (err) {
      console.error('Error en confirmarSetup:', err);
      if (overlay) overlay.classList.remove('hidden');
      alert('Error al iniciar la partida: ' + (err.message || err));
    }
  }

  function jugadorActual() {
    const s = Game.estado;
    return s.modo === 'local' ? s.turnoActual : 'player';
  }

  function modoPonerEnergia() {
    const s = Game.estado;
    const actor = jugadorActual();
    if (s.turnoActual !== actor || s.accionesRestantes < 1) return;
    const j = s[actor];
    const tieneEnergia = j.mano.some(c => c.tipo === 'energia') || (j.bocaAbajo || []).some(c => c && c.tipo === 'energia');
    if (!tieneEnergia) return;
    if (!j.heroes.some(h => h && h.vida > 0 && (h.energiaStack ? h.energiaStack.length < 3 : true))) return;
    if (s.turnoActual !== 'player') {
      modoPonerEnergiaModal();
      return;
    }
    modoInteractivo = { tipo: 'energia' };
    UI.establecerModoInteractivo(modoInteractivo);
    UI.renderizarTablero();
  }

  function modoPonerSoporte() {
    const s = Game.estado;
    if (!s || s.ganador) return;
    if (s.turnoActual !== 'player' || s.accionesRestantes < 1) return;
    const j = s.player;
    const tieneEspacio = (j.bocaAbajo || []).some(c => !c);
    const tieneCarta = j.mano.some(c => c);
    if (!tieneEspacio || !tieneCarta) return;
    modoInteractivo = { tipo: 'soporte' };
    UI.establecerModoInteractivo(modoInteractivo);
    UI.renderizarTablero();
  }

  function modoPonerEnergiaModal() {
    const s = Game.estado;
    const actor = s.turnoActual;
    const j = s[actor];
    const opciones = [];
    j.mano.forEach((c, i) => { if (c.tipo === 'energia') opciones.push({ tipo: 'mano', indiceMano: i, nombre: `Energía mano (${i + 1})`, emoji: '⚡' }); });
    (j.bocaAbajo || []).forEach((c, i) => { if (c && c.tipo === 'energia') opciones.push({ tipo: 'soporte', indiceSoporte: i, nombre: `Energía soporte (${i + 1})`, emoji: '⚡' }); });
    const heroesConEspacio = [];
    j.heroes.forEach((h, i) => {
      if (h && h.vida > 0 && (h.energiaStack ? h.energiaStack.length < 3 : true))
        heroesConEspacio.push({ heroeSlot: i, nombre: h.nombre, emoji: UI.getEmojiCarta(h) });
    });
    if (opciones.length === 0) return;
    UI.mostrarModalSeleccion('Elige qué carta de energía poner', opciones, (opt) => {
      if (!opt) return;
      function poner(heroeSlot) {
        const result = opt.tipo === 'soporte'
          ? Game.ponerEnergiaDesdeSoporte(actor, opt.indiceSoporte, heroeSlot)
          : Game.ponerEnergia(actor, opt.indiceMano, heroeSlot);
        if (result.ok) UI.renderizarTablero();
      }
      if (heroesConEspacio.length === 1) poner(heroesConEspacio[0].heroeSlot);
      else UI.mostrarModalSeleccion('¿Sobre qué héroe poner la energía?', heroesConEspacio, (optHeroe) => {
        if (optHeroe != null && optHeroe.heroeSlot != null) poner(optHeroe.heroeSlot);
      });
    });
  }

  function modoPonerBocaAbajo() {
    const s = Game.estado;
    if (s.turnoActual !== 'player' || s.accionesRestantes < 1) return;
    const j = s.player;
    const slotsConCarta = [];
    j.bocaAbajo.forEach((c, i) => { if (c) slotsConCarta.push({ slot: i, nombre: 'Carta ' + (i + 1), emoji: '🃏' }); });
    if (slotsConCarta.length === 0) return;
    const heroesConEspacio = [];
    j.heroes.forEach((h, i) => {
      if (h && h.vida > 0 && (h.faceDownStack ? h.faceDownStack.length < 3 : true))
        heroesConEspacio.push({ heroeSlot: i, nombre: h.nombre, emoji: UI.getEmojiCarta(h) });
    });
    if (heroesConEspacio.length === 0) return;
    UI.mostrarModalSeleccion('Elige qué carta boca abajo poner', slotsConCarta, (opt) => {
      if (!opt || opt.slot == null) return;
      if (heroesConEspacio.length === 1) {
        const result = Game.ponerBocaAbajoEnHeroe('player', opt.slot, heroesConEspacio[0].heroeSlot);
        if (result.ok) UI.renderizarTablero();
      } else {
        UI.mostrarModalSeleccion('¿Sobre qué héroe?', heroesConEspacio, (optHeroe) => {
          if (optHeroe != null && optHeroe.heroeSlot != null) {
            const result = Game.ponerBocaAbajoEnHeroe('player', opt.slot, optHeroe.heroeSlot);
            if (result.ok) UI.renderizarTablero();
          }
        });
      }
    });
  }

  function iniciarAtaque() {
    const s = Game.estado;
    const actor = jugadorActual();
    if (s.turnoActual !== actor || s.accionesRestantes < 1) return;
    if (!s[actor].heroes.some((h, i) => Game.puedeAtacar(actor, i))) return;
    if (s.turnoActual !== 'player') {
      iniciarAtaqueModal();
      return;
    }
    modoInteractivo = { tipo: 'atacar' };
    UI.establecerModoInteractivo(modoInteractivo);
    UI.renderizarTablero();
  }

  function iniciarAtaqueModal() {
    const s = Game.estado;
    const actor = s.turnoActual;
    UI.pedirHeroeAtacante(actor, (atacanteSlot) => {
      if (atacanteSlot == null) return;
      UI.pedirObjetivoAtaque(actor, (defensorSlot) => {
        if (defensorSlot == null) return;
        const result = Game.atacar(actor, atacanteSlot, defensorSlot);
        if (!result.ok) { alert(result.msg || 'No se puede atacar'); return; }
        if (typeof GameLog !== 'undefined' && result.atacanteNombre) {
          if (result.bloqueado) GameLog.addBlockedDamage(result.atacanteJugador, result.atacanteNombre, result.defensorNombre, result.danoBloqueado);
          else if (result.dano != null) GameLog.addDamage(result.atacanteJugador, result.atacanteNombre, result.defensorNombre, result.dano);
        }
        if (result.curacion != null && typeof GameLog !== 'undefined') GameLog.addHeal(result.jugadorCurado, result.heroeNombre, result.curacion);
        // Agregar efectos especiales al log
        if (result.efectoEspecial && typeof GameLog !== 'undefined') {
          const efecto = result.efectoEspecial;
          const jugador = result.atacanteJugador || actor;
          const nombreAtacante = result.atacanteNombre || 'Héroe';
          if (efecto.tipo === 'paralizar') {
            GameLog.addSpecialEffect(jugador, nombreAtacante, `ha paralizado a ${efecto.heroe} por ${efecto.turnos} turno(s)`);
          } else if (efecto.tipo === 'electrocutar') {
            GameLog.addSpecialEffect(jugador, nombreAtacante, `ha electrocutado a ${efecto.heroe} por ${efecto.turnos} turnos`);
          } else if (efecto.tipo === 'quemar_carta') {
            GameLog.addSpecialEffect(jugador, nombreAtacante, 'puede quemar una carta del rival');
          } else if (efecto.tipo === 'destruir_energia') {
            GameLog.addSpecialEffect(jugador, nombreAtacante, `ha destruido 1 energía de ${efecto.heroe}`);
          } else if (efecto.tipo === 'robar_carta') {
            GameLog.addSpecialEffect(jugador, nombreAtacante, `ha robado ${efecto.cantidad} carta(s) del mazo`);
          } else if (efecto.tipo === 'fenix_revivir') {
            GameLog.addSpecialEffect(actor === 'player' ? 'rival' : 'player', efecto.heroe, 'ha revivido y vuelto a la batalla');
          }
        }
        // Mostrar mensaje de héroe asesinado
        if (result.defensorDestruido && actor === 'player') {
          UI.mostrarMensajeHeroeAsesinado('enemigo');
          if (typeof GameLog !== 'undefined') {
            GameLog.addSystem(`<strong>${result.defensorNombre || 'Héroe enemigo'}</strong> ha sido eliminado ⚔️`);
          }
        }
        if (result.atacanteDestruido && actor === 'player') {
          UI.mostrarMensajeHeroeAsesinado('aliado');
          if (typeof GameLog !== 'undefined') {
            GameLog.addSystem(`<strong>${result.atacanteNombre || 'Héroe aliado'}</strong> ha sido eliminado 💀`);
          }
        }
        const atacanteZone = actor === 'player' ? 'player-zone' : 'rival-zone';
        const defensorZone = actor === 'player' ? 'rival-zone' : 'player-zone';
        const atacanteEl = document.querySelector(`#${atacanteZone} .hero-slot[data-slot="${atacanteSlot}"]`);
        const defensorEl = document.querySelector(`#${defensorZone} .hero-slot[data-slot="${defensorSlot}"]`);
        const s = Game.estado;
        if (typeof Sounds !== 'undefined' && Sounds.atacar) Sounds.atacar();
        UI.animarAtaque(atacanteEl, defensorEl, () => {
          function rest() {
            var aliadoMuerto = (result.defensorDestruido && actor === 'rival') || (result.atacanteDestruido && actor === 'player');
            var enemigoMuerto = (result.defensorDestruido && actor === 'player') || (result.atacanteDestruido && actor === 'rival');
            var oponente = actor === 'player' ? 'rival' : 'player';
            function continuar() {
              if (result.luciferQuemar && s[oponente].mano.length > 0) {
                UI.pedirQuemarCartaRival(oponente, (idx) => {
                  if (idx != null) Game.quemarCartaDe(oponente, idx);
                  UI.renderizarTablero();
                  comprobarGanador();
                });
              } else {
                UI.renderizarTablero();
                comprobarGanador();
              }
            }
            var delay = 1500;
            if ((aliadoMuerto || enemigoMuerto) && result.luciferQuemar && s[oponente].mano.length > 0) {
              delay = 3200;
            }
            if (aliadoMuerto) {
              UI.mostrarMensajeHeroeAsesinado('aliado');
              setTimeout(continuar, delay);
            } else if (enemigoMuerto) {
              UI.mostrarMensajeHeroeAsesinado('enemigo');
              setTimeout(continuar, delay);
            } else {
              continuar();
            }
          }
          if (result.curacion != null) UI.animarCuracion(defensorEl, rest);
          else if (result.cartaRevelada) UI.animarTrampa(defensorEl, rest);
          else rest();
        });
      });
    });
  }

  function pasarTurno() {
    const s = Game.estado;
    const actor = jugadorActual();
    if (s.turnoActual !== actor) return;
    Game.robarHastaMano(actor);
    if (typeof Sounds !== 'undefined' && Sounds.robar) Sounds.robar();
    UI.renderizarTablero();
  }

  function terminarTurno() {
    if (modoPartida === 'online' && typeof Online !== 'undefined') Online.enviarAccion({ tipo: 'terminar_turno' });
    const s = Game.estado;
    cancelarModoInteractivo();
    Game.terminarTurno();
    if (typeof Sounds !== 'undefined' && Sounds.robar) Sounds.robar();
    UI.renderizarTablero();
    comprobarGanador();
    const stateNow = Game.estado;
    if (stateNow.ganador) return;
    if (stateNow.turnoActual === 'rival' && esModoVsIA()) setTimeout(turnoIA, 800);
  }

  function rendirse() {
    const s = Game.estado;
    if (!s || s.ganador) return;
    Game.rendirse();
    Sounds.perder();
    UI.mostrarGameOver('rival', true);
    if (typeof Progresion !== 'undefined' && Progresion.finPartida) {
      const opciones = { dificultad: s.dificultad, modo: s.modo, rendido: true };
      const res = Progresion.finPartida('rival', opciones);
      setTimeout(() => notificarProgresion(res), 800);
    }
  }

  function comprobarGanador() {
    const s = Game.estado;
    if (s.ganador) {
      ultimoGanadorPartida = s.ganador;
      if (s.ganador === 'player') Sounds.ganar(); else Sounds.perder();
      UI.mostrarGameOver(s.ganador, false);
      const msgEl = document.getElementById('gameover-message');
      if (msgEl) {
        if (s.modo === 'campania' && s.ganador === 'player' && typeof Progresion !== 'undefined') {
          Progresion.desbloquearNivelCampania((s.nivelCampania || 0) + 1);
          msgEl.textContent = 'Nivel ' + (s.nivelCampania + 1) + ' completado. ¡Siguiente nivel desbloqueado!';
        } else if (s.modo === 'torneo') {
          if (s.ganador === 'player') torneoGanadas++;
          const cfg = typeof TORNEO_CONFIG !== 'undefined' ? TORNEO_CONFIG : { rondas: 3 };
          if (s.ganador === 'player' && torneoRonda < cfg.rondas - 1) msgEl.textContent = 'Ronda ganada. ¡Siguiente ronda!';
          else if (s.ganador === 'player') msgEl.textContent = '¡Torneo ganado!';
          else msgEl.textContent = 'Torneo perdido. Rondas ganadas: ' + torneoGanadas;
        } else if (s.modo === 'survival') {
          if (s.ganador === 'player') {
            if (typeof Progresion !== 'undefined') Progresion.actualizarRachaSurvival(s.olaSurvival || olaSurvivalActual);
            msgEl.textContent = 'Ola ' + (s.olaSurvival || olaSurvivalActual) + ' superada. ¡Siguiente!';
          } else {
            const racha = typeof Progresion !== 'undefined' && Progresion.estado ? Progresion.estado.mejorRachaSurvival : 0;
            msgEl.textContent = 'Derrota. Mejor racha: ' + racha;
          }
        } else if (s.modo === 'desafio' && s.ganador === 'player' && s.desafioId && typeof Progresion !== 'undefined') {
          Progresion.marcarDesafioCompletado(s.desafioId);
          msgEl.textContent = '¡Desafío completado!';
        }
      }
      if (typeof Progresion !== 'undefined' && Progresion.finPartida) {
        const opciones = { dificultad: s.dificultad, modo: s.modo };
        if (s.olaSurvival != null) opciones.olaSurvival = s.olaSurvival;
        if (s.desafioId) opciones.desafioId = s.desafioId;
        const res = Progresion.finPartida(s.ganador, opciones);
        setTimeout(() => notificarProgresion(res), 800);
      }
    }
  }

  function turnoIA() {
    const s = Game.estado;
    if (!s || s.turnoActual !== 'rival' || s.ganador) return;
    if (s.turnoPerdido && s.turnoPerdido.rival > 0) {
      Game.terminarTurno();
      UI.renderizarTablero();
      comprobarGanador();
      if (Game.estado && Game.estado.turnoActual === 'rival') setTimeout(turnoIA, 600);
      return;
    }
    const accion = IA.jugar();
    if (!accion) {
      Game.terminarTurno();
      UI.renderizarTablero();
      comprobarGanador();
      if (Game.estado && Game.estado.turnoActual === 'rival') setTimeout(turnoIA, 600);
      return;
    }
    if (accion.tipo === 'terminar_turno') {
      Game.terminarTurno();
      UI.renderizarTablero();
      comprobarGanador();
      if (Game.estado && !Game.estado.ganador && Game.estado.turnoActual === 'rival') setTimeout(turnoIA, 600);
      return;
    }
    if (accion.tipo === 'energia') {
      const heroeSlot = accion.heroeSlot != null ? accion.heroeSlot : 0;
      const result = Game.ponerEnergia('rival', accion.indiceMano, heroeSlot);
      if (result.ok) {
        UI.renderizarTablero();
        setTimeout(turnoIA, 500);
      } else {
        Game.terminarTurno();
        UI.renderizarTablero();
        comprobarGanador();
        if (Game.estado && Game.estado.turnoActual === 'rival') setTimeout(turnoIA, 600);
      }
      return;
    }
    if (accion.tipo === 'energia_soporte') {
      const heroeSlot = accion.heroeSlot != null ? accion.heroeSlot : 0;
      const result = Game.ponerEnergiaDesdeSoporte('rival', accion.indiceSoporte, heroeSlot);
      if (result.ok) {
        UI.renderizarTablero();
        setTimeout(turnoIA, 500);
      } else {
        Game.terminarTurno();
        UI.renderizarTablero();
        if (Game.estado && Game.estado.turnoActual === 'rival') setTimeout(turnoIA, 600);
      }
      return;
    }
    if (accion.tipo === 'boca_abajo') {
      const result = Game.ponerBocaAbajoEnHeroe('rival', accion.indiceBocaAbajo, accion.heroeSlot);
      if (result.ok) {
        UI.renderizarTablero();
        setTimeout(turnoIA, 500);
      } else {
        Game.terminarTurno();
        UI.renderizarTablero();
        if (Game.estado && Game.estado.turnoActual === 'rival') setTimeout(turnoIA, 600);
      }
      return;
    }
    if (accion.tipo === 'atacar') {
      const result = Game.atacar('rival', accion.atacanteSlot, accion.defensorSlot);
      if (!result.ok) {
        Game.terminarTurno();
        UI.renderizarTablero();
        if (Game.estado && Game.estado.turnoActual === 'rival') setTimeout(turnoIA, 600);
        return;
      }
      if (typeof GameLog !== 'undefined' && result.atacanteNombre) {
        if (result.bloqueado) GameLog.addBlockedDamage(result.atacanteJugador, result.atacanteNombre, result.defensorNombre, result.danoBloqueado);
        else if (result.dano != null) GameLog.addDamage(result.atacanteJugador, result.atacanteNombre, result.defensorNombre, result.dano);
      }
      // Agregar efectos especiales al log
      if (result.efectoEspecial && typeof GameLog !== 'undefined') {
        const efecto = result.efectoEspecial;
        const jugador = result.atacanteJugador || 'rival';
        const nombreAtacante = result.atacanteNombre || 'Héroe';
        if (efecto.tipo === 'paralizar') {
          GameLog.addSpecialEffect(jugador, nombreAtacante, `ha paralizado a ${efecto.heroe} por ${efecto.turnos} turno(s)`);
        } else if (efecto.tipo === 'electrocutar') {
          GameLog.addSpecialEffect(jugador, nombreAtacante, `ha electrocutado a ${efecto.heroe} por ${efecto.turnos} turnos`);
        } else if (efecto.tipo === 'quemar_carta') {
          GameLog.addSpecialEffect(jugador, nombreAtacante, 'puede quemar una carta del rival');
        } else if (efecto.tipo === 'destruir_energia') {
          GameLog.addSpecialEffect(jugador, nombreAtacante, `ha destruido 1 energía de ${efecto.heroe}`);
        } else if (efecto.tipo === 'robar_carta') {
          GameLog.addSpecialEffect(jugador, nombreAtacante, `ha robado ${efecto.cantidad} carta(s) del mazo`);
        } else if (efecto.tipo === 'fenix_revivir') {
          GameLog.addSpecialEffect('player', efecto.heroe, 'ha revivido y vuelto a la batalla');
        }
      }
      // Mostrar mensaje de héroe asesinado
      if (result.defensorDestruido) {
        UI.mostrarMensajeHeroeAsesinado('aliado');
        if (typeof GameLog !== 'undefined') {
          GameLog.addSystem(`<strong>${result.defensorNombre || 'Héroe aliado'}</strong> ha sido eliminado 💀`);
        }
      }
      if (result.atacanteDestruido) {
        UI.mostrarMensajeHeroeAsesinado('enemigo');
        if (typeof GameLog !== 'undefined') {
          GameLog.addSystem(`<strong>${result.atacanteNombre || 'Héroe enemigo'}</strong> ha sido eliminado ⚔️`);
        }
      }
      if (result.curacion != null && typeof GameLog !== 'undefined') GameLog.addHeal(result.jugadorCurado, result.heroeNombre, result.curacion);
      const atacanteEl = document.querySelector('#rival-zone .hero-slot[data-slot="' + accion.atacanteSlot + '"]');
      const defensorEl = document.querySelector('#player-zone .hero-slot[data-slot="' + accion.defensorSlot + '"]');
      if (typeof Sounds !== 'undefined' && Sounds.atacar) Sounds.atacar();
      UI.animarAtaque(atacanteEl, defensorEl, () => {
        function rest() {
          var aliadoMuerto = result.defensorDestruido;
          var enemigoMuerto = result.atacanteDestruido;
          function continuar() {
            if (result.luciferQuemar && Game.estado.player.mano.length > 0) {
              const idx = Math.floor(Math.random() * Game.estado.player.mano.length);
              Game.quemarCartaDe('player', idx);
            }
            UI.renderizarTablero();
            comprobarGanador();
            if (Game.estado.ganador) return;
            setTimeout(turnoIA, 700);
          }
          if (aliadoMuerto) {
            UI.mostrarMensajeHeroeAsesinado('aliado');
            setTimeout(continuar, 1500);
          } else if (enemigoMuerto) {
            UI.mostrarMensajeHeroeAsesinado('enemigo');
            setTimeout(continuar, 1500);
          } else {
            continuar();
          }
        }
        if (result.curacion != null) UI.animarCuracion(defensorEl, rest);
        else if (result.cartaRevelada) UI.animarTrampa(defensorEl, rest);
        else rest();
      });
      return;
    }
    if (accion.tipo === 'activar_trampa') {
      const parametros = accion.heroeSlot != null ? { heroeSlot: accion.heroeSlot } : {};
      const result = Game.activarTrampa('rival', accion.slotBocaAbajo, parametros);
      if (result.ok) {
        if (result.curacion != null && typeof GameLog !== 'undefined') GameLog.addHeal(result.jugadorCurado, result.heroeNombre, result.curacion);
        UI.renderizarTablero();
        setTimeout(turnoIA, 500);
      } else {
        Game.terminarTurno();
        UI.renderizarTablero();
        if (Game.estado && Game.estado.turnoActual === 'rival') setTimeout(turnoIA, 600);
      }
      return;
    }
    if (accion.tipo === 'usar_efecto_mano') {
      const parametros = accion.heroeSlot != null ? { heroeSlot: accion.heroeSlot } : {};
      const result = Game.usarEfectoDesdeMano('rival', accion.indiceMano, parametros);
      if (result.ok) {
        if (result.curacion != null && typeof GameLog !== 'undefined') GameLog.addHeal(result.jugadorCurado, result.heroeNombre, result.curacion);
        UI.renderizarTablero();
        setTimeout(turnoIA, 500);
      } else {
        Game.terminarTurno();
        UI.renderizarTablero();
        if (Game.estado && Game.estado.turnoActual === 'rival') setTimeout(turnoIA, 600);
      }
      return;
    }
    Game.terminarTurno();
    UI.renderizarTablero();
    if (Game.estado && Game.estado.turnoActual === 'rival') setTimeout(turnoIA, 600);
  }

  window.__menuInit = init;
  window.__empezarPartida = empezarPartida;
  window.__mostrarReglas = mostrarReglas;
  window.__mostrarLogros = mostrarLogros;
  window.__mostrarSonido = mostrarSonido;
  window.__mostrarOnline = mostrarOnline;
  window.__empezarTorneo = empezarTorneo;
  window.__empezarSurvival = empezarSurvival;
  window.__cerrarOnline = cerrarOnline;
  window.actualizarMenuStats = actualizarMenuStats;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
