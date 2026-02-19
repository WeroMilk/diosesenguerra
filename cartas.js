/**
 * Dioses en Guerra - Definición de cartas
 * Todas las cartas del mazo: héroes, energía y trampas/hechizos.
 */

const CARTAS = {
  // --- HÉROES / CRIATURAS ---
  heroes: [
    {
      id: 'medusa',
      nombre: 'Medusa',
      emoji: '🐍',
      tipo: 'heroe',
      costoEnergia: 2,
      ataque: 3,
      vida: 2,
      vidaMax: 2,
      habilidad: 'Al entrar en juego, el oponente pierde su próximo turno.',
      habilidadId: 'medusa_entrada',
      atributo: 'oscuridad',
      ilustracion: 'medusa.jpg'
    },
    {
      id: 'thor',
      nombre: 'Thor',
      emoji: '⚡',
      tipo: 'heroe',
      costoEnergia: 3,
      ataque: 5,
      vida: 5,
      vidaMax: 5,
      habilidad: 'Al atacar, deja "electrocutado" al rival: pierde 2 turnos.',
      habilidadId: 'thor_ataque',
      atributo: 'luz',
      ilustracion: 'thor.jpg'
    },
    {
      id: 'lucifer',
      nombre: 'Lucifer',
      emoji: '😈',
      tipo: 'heroe',
      costoEnergia: 3,
      ataque: 6,
      vida: 4,
      vidaMax: 4,
      habilidad: 'Al atacar, el jugador elige una carta de la mano del rival y la quema.',
      habilidadId: 'lucifer_ataque',
      atributo: 'oscuridad',
      ilustracion: 'lucifer.jpg'
    },
    {
      id: 'centauro',
      nombre: 'Centauro',
      emoji: '🐴',
      tipo: 'heroe',
      costoEnergia: 1,
      ataque: 2,
      vida: 2,
      vidaMax: 2,
      habilidad: 'Al atacar, destruye 1 carta de energía del oponente.',
      habilidadId: 'centauro_ataque',
      atributo: 'fuego',
      ilustracion: 'centauro.jpg'
    },
    {
      id: 'odin',
      nombre: 'Odin',
      emoji: '👁️',
      tipo: 'heroe',
      costoEnergia: 3,
      ataque: 7,
      vida: 6,
      vidaMax: 6,
      habilidad: 'Puede ver todas las cartas ocultas del rival. +2 daño vs heroínas/mortal.',
      habilidadId: 'odin_vision',
      atributo: 'luz',
      ilustracion: 'odin.jpg'
    },
    {
      id: 'cleopatra',
      nombre: 'Cleopatra',
      emoji: '👑',
      tipo: 'heroe',
      costoEnergia: 2,
      ataque: 3,
      vida: 4,
      vidaMax: 4,
      habilidad: 'Heroína. Al ser atacada, el atacante pierde 1 de ataque este turno.',
      habilidadId: 'cleopatra_defensa',
      atributo: 'humano',
      ilustracion: 'cleopatra.jpg'
    },
    {
      id: 'minotauro',
      nombre: 'Minotauro',
      emoji: '🐂',
      tipo: 'heroe',
      costoEnergia: 2,
      ataque: 4,
      vida: 3,
      vidaMax: 3,
      habilidad: 'Al atacar, si el rival tiene 2 o más energías, destruye 1.',
      habilidadId: 'minotauro_ataque',
      atributo: 'oscuridad',
      ilustracion: 'minotauro.jpg'
    },
    {
      id: 'hercules',
      nombre: 'Hércules',
      emoji: '💪',
      tipo: 'heroe',
      costoEnergia: 3,
      ataque: 5,
      vida: 5,
      vidaMax: 5,
      habilidad: 'Semidiós. Una vez por partida: cura 2 de vida a un héroe aliado.',
      habilidadId: 'hercules_cura',
      atributo: 'luz',
      ilustracion: 'hercules.jpg'
    },
    {
      id: 'anubis',
      nombre: 'Anubis',
      emoji: '🦊',
      tipo: 'heroe',
      costoEnergia: 2,
      ataque: 3,
      vida: 4,
      vidaMax: 4,
      habilidad: 'Al destruir un héroe enemigo, roba 1 carta.',
      habilidadId: 'anubis_destruir',
      atributo: 'oscuridad',
      ilustracion: 'anubis.jpg'
    },
    {
      id: 'fenix',
      nombre: 'Fénix',
      emoji: '🔥',
      tipo: 'heroe',
      costoEnergia: 2,
      ataque: 2,
      vida: 3,
      vidaMax: 3,
      habilidad: 'Al ser destruido, vuelve a tu mano (una vez por partida).',
      habilidadId: 'fenix_revivir',
      atributo: 'fuego',
      ilustracion: 'fenix.jpg'
    },
    {
      id: 'hydra',
      nombre: 'Hydra',
      emoji: '🐉',
      tipo: 'heroe',
      costoEnergia: 3,
      ataque: 4,
      vida: 5,
      vidaMax: 5,
      habilidad: 'Cada vez que recibe daño, gana +1 ataque hasta el fin del turno.',
      habilidadId: 'hydra_dano',
      atributo: 'oscuridad',
      ilustracion: 'hydra.jpg'
    },
    {
      id: 'zeus',
      nombre: 'Zeus',
      emoji: '☁️',
      tipo: 'heroe',
      costoEnergia: 3,
      ataque: 6,
      vida: 5,
      vidaMax: 5,
      habilidad: 'Dios. Al atacar, paraliza al héroe atacado 1 turno (no puede atacar).',
      habilidadId: 'zeus_paralizar',
      atributo: 'luz',
      ilustracion: 'zeus.jpg'
    }
  ],

  // --- ENERGÍA (sin efecto, solo recurso) ---
  energia: [
    { id: 'energia_1', nombre: 'Energía', emoji: '⚡', tipo: 'energia', ilustracion: 'energia.jpg' },
    { id: 'energia_2', nombre: 'Energía', emoji: '⚡', tipo: 'energia', ilustracion: 'energia.jpg' },
    { id: 'energia_3', nombre: 'Energía', emoji: '⚡', tipo: 'energia', ilustracion: 'energia.jpg' },
    { id: 'energia_4', nombre: 'Energía', emoji: '⚡', tipo: 'energia', ilustracion: 'energia.jpg' },
    { id: 'energia_5', nombre: 'Energía', emoji: '⚡', tipo: 'energia', ilustracion: 'energia.jpg' },
    { id: 'energia_6', nombre: 'Energía', emoji: '⚡', tipo: 'energia', ilustracion: 'energia.jpg' },
    { id: 'energia_7', nombre: 'Energía', emoji: '⚡', tipo: 'energia', ilustracion: 'energia.jpg' },
    { id: 'energia_8', nombre: 'Energía', emoji: '⚡', tipo: 'energia', ilustracion: 'energia.jpg' },
    { id: 'energia_9', nombre: 'Energía', emoji: '⚡', tipo: 'energia', ilustracion: 'energia.jpg' },
    { id: 'energia_10', nombre: 'Energía', emoji: '⚡', tipo: 'energia', ilustracion: 'energia.jpg' },
    { id: 'energia_11', nombre: 'Energía', emoji: '⚡', tipo: 'energia', ilustracion: 'energia.jpg' },
    { id: 'energia_12', nombre: 'Energía', emoji: '⚡', tipo: 'energia', ilustracion: 'energia.jpg' },
    { id: 'energia_13', nombre: 'Energía', emoji: '⚡', tipo: 'energia', ilustracion: 'energia.jpg' },
    { id: 'energia_14', nombre: 'Energía', emoji: '⚡', tipo: 'energia', ilustracion: 'energia.jpg' },
    { id: 'energia_15', nombre: 'Energía', emoji: '⚡', tipo: 'energia', ilustracion: 'energia.jpg' },
    { id: 'energia_16', nombre: 'Energía', emoji: '⚡', tipo: 'energia', ilustracion: 'energia.jpg' },
    { id: 'energia_17', nombre: 'Energía', emoji: '⚡', tipo: 'energia', ilustracion: 'energia.jpg' },
    { id: 'energia_18', nombre: 'Energía', emoji: '⚡', tipo: 'energia', ilustracion: 'energia.jpg' }
  ],

  // --- TRAMPAS / HECHIZOS (boca abajo, se activan por condición) ---
  trampas: [
    {
      id: 'curacion',
      nombre: 'Curación',
      emoji: '💚',
      tipo: 'trampa',
      efecto: 'Restaura 2 de vida a un héroe aliado. Se activa al revelar.',
      efectoId: 'curacion',
      ilustracion: 'curacion.jpg'
    },
    {
      id: 'vision',
      nombre: 'Visión',
      emoji: '👁️',
      tipo: 'trampa',
      efecto: 'Obliga al rival a mostrar mano y cartas boca abajo.',
      efectoId: 'vision',
      ilustracion: 'vision.jpg'
    },
    {
      id: 'contraataque',
      nombre: 'Contra Ataque',
      emoji: '🗡️',
      tipo: 'trampa',
      efecto: 'Cuando un héroe enemigo ataca, hace 2 de daño al atacante.',
      efectoId: 'contraataque',
      ilustracion: 'contraataque.jpg'
    },
    {
      id: 'robo',
      nombre: 'Robo',
      emoji: '🃏',
      tipo: 'trampa',
      efecto: 'Roba 2 cartas extra. Se activa al revelar.',
      efectoId: 'robo',
      ilustracion: 'robo.jpg'
    },
    {
      id: 'paralisis',
      nombre: 'Antídoto',
      emoji: '💉',
      tipo: 'trampa',
      efecto: 'Quita parálisis/electrocutado de un héroe aliado.',
      efectoId: 'antidoto',
      ilustracion: 'antidoto.jpg'
    },
    {
      id: 'escudo',
      nombre: 'Escudo',
      emoji: '🛡️',
      tipo: 'trampa',
      efecto: 'Cuando un héroe aliado recibe ataque, reduce el daño en 2 (una vez).',
      efectoId: 'escudo',
      ilustracion: 'escudo.jpg'
    }
  ]
};

/**
 * Obtiene una copia de una carta por id (para poner en el mazo/mano).
 * Los héroes se clonan con vida actual = vidaMax.
 */
function clonarCarta(carta) {
  const c = { ...carta };
  if (c.tipo === 'heroe') {
    c.vida = c.vidaMax;
    c.paralizado = 0;
    c.electrocutado = 0;
    c.usadoHabilidad = false;
    c.fenixUsado = false;
  }
  return c;
}

/**
 * Construye el mazo compartido para una partida (100 cartas).
 * 36 héroes (3 copias de cada uno), 52 energías, 12 trampas (2 de cada).
 */
function construirMazo() {
  const mazo = [];
  // 3 copias de cada héroe (36 cartas héroe)
  CARTAS.heroes.forEach(h => {
    mazo.push(clonarCarta({ ...h, id: h.id + '_1' }));
    mazo.push(clonarCarta({ ...h, id: h.id + '_2' }));
    mazo.push(clonarCarta({ ...h, id: h.id + '_3' }));
  });
  // 52 energías
  for (let i = 0; i < 52; i++) {
    const e = CARTAS.energia[i % CARTAS.energia.length];
    mazo.push({ ...e, id: e.id + '_' + i });
  }
  // 12 trampas (2 copias de cada)
  CARTAS.trampas.forEach(t => {
    mazo.push({ ...t });
    mazo.push({ ...t });
  });
  return barajar(mazo);
}

function barajar(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Cuenta cuántas cartas de tipo héroe quedan en el mazo.
 */
function contarHeroesEnMazo(mazo) {
  return mazo.filter(c => c.tipo === 'heroe').length;
}

/**
 * Asigna las 8 cartas iniciales al azar: 2 héroes al campo, 3 boca abajo, 3 en mano.
 */
function asignarSetupAleatorio(manoInicial) {
  const copia = barajar([...manoInicial]);
  const heroes = [];
  const resto = [];
  for (const c of copia) {
    if (heroes.length < 2 && c.tipo === 'heroe') heroes.push(c);
    else resto.push(c);
  }
  while (heroes.length < 2 && resto.length > 0) heroes.push(resto.shift());
  const restBarajado = barajar(resto);
  const bocaAbajo = restBarajado.slice(0, 3);
  const mano = restBarajado.slice(3, 6);
  return { heroes, bocaAbajo, mano };
}
