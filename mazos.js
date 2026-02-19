/**
 * Dioses en Guerra - Mazos predefinidos y construcción desde definición
 * Depende de cartas.js (CARTAS, barajar, clonarCarta).
 */

const MAZOS_PREDEFINIDOS = [
  { id: 'clasico', nombre: 'Clásico' },
  { id: 'agresivo', nombre: 'Agresivo', idsHeroes: ['thor', 'zeus', 'lucifer', 'minotauro', 'centauro', 'hydra'] },
  { id: 'defensivo', nombre: 'Defensivo', idsHeroes: ['medusa', 'cleopatra', 'fenix', 'hercules', 'anubis', 'odin'] }
];

function construirMazoDesdeDefinicion(def) {
  if (!def || typeof CARTAS === 'undefined') return typeof construirMazo !== 'undefined' ? construirMazo() : [];
  const mazo = [];
  const heroes = def.idsHeroes && def.idsHeroes.length
    ? def.idsHeroes.map(id => CARTAS.heroes.find(h => h.id === id)).filter(Boolean)
    : CARTAS.heroes;
  heroes.forEach(h => {
    mazo.push(clonarCarta({ ...h, id: h.id + '_1' }));
    mazo.push(clonarCarta({ ...h, id: h.id + '_2' }));
  });
  const trampas = def.idsTrampas && def.idsTrampas.length
    ? def.idsTrampas.map(id => CARTAS.trampas.find(t => t.id === id)).filter(Boolean)
    : CARTAS.trampas;
  trampas.forEach(t => mazo.push({ ...t }));
  const energia = def.idsEnergia && def.idsEnergia.length
    ? def.idsEnergia.map(id => CARTAS.energia.find(e => e.id === id)).filter(Boolean)
    : CARTAS.energia;
  energia.forEach(e => mazo.push({ ...e }));
  return barajar(mazo);
}

function construirMazoConId(idMazo) {
  if (!idMazo || idMazo === 'clasico') return typeof construirMazo !== 'undefined' ? construirMazo() : construirMazoDesdeDefinicion({});
  const def = MAZOS_PREDEFINIDOS.find(m => m.id === idMazo);
  if (def) return construirMazoDesdeDefinicion(def);
  if (typeof Progresion !== 'undefined' && Progresion.estado && Progresion.estado.mazosPersonalizados) {
    const custom = Progresion.estado.mazosPersonalizados.find(m => m.id === idMazo);
    if (custom) return construirMazoDesdeDefinicion(custom);
  }
  return typeof construirMazo !== 'undefined' ? construirMazo() : construirMazoDesdeDefinicion({});
}

function getMazosDisponibles() {
  const lista = MAZOS_PREDEFINIDOS.map(m => ({ id: m.id, nombre: m.nombre }));
  if (typeof Progresion !== 'undefined' && Progresion.estado && Progresion.estado.mazosPersonalizados) {
    Progresion.estado.mazosPersonalizados.forEach(m => lista.push({ id: m.id, nombre: m.nombre + ' (personalizado)' }));
  }
  return lista;
}
