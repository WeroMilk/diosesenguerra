/**
 * Dioses en Guerra - Datos de campaña y desafíos
 */

const NIVELES_CAMPANIA = [
  { id: 0, titulo: 'El despertar', textoHistoria: 'Los dioses despiertan. Tu primer combate te espera.', dificultadIA: 'facil' },
  { id: 1, titulo: 'Fuerzas oscuras', textoHistoria: 'Las sombras se alían. Demuestra tu valor.', dificultadIA: 'facil' },
  { id: 2, titulo: 'El consejo del trueno', textoHistoria: 'Thor no perdona. Enfrenta su ira.', dificultadIA: 'intermedio' },
  { id: 3, titulo: 'Ojo de Odín', textoHistoria: 'El padre de los dioses observa. Vence a su campeón.', dificultadIA: 'intermedio' },
  { id: 4, titulo: 'Prueba final', textoHistoria: 'Solo el más fuerte sobrevive. JARCOR te espera.', dificultadIA: 'jarcor' }
];

const DESAFIOS = [
  { id: 'desafio_1', nombre: 'Sin energía extra', descripcion: 'Juega una partida sin usar la energía gratuita de turno (solo cartas de energía).', reglasDesafio: { sinEnergiaGratis: true } },
  { id: 'desafio_2', nombre: 'Un golpe', descripcion: 'Gana usando solo 1 acción por turno.', reglasDesafio: { accionesPorTurno: 1 } },
  { id: 'desafio_3', nombre: 'Contra el reloj', descripcion: 'Gana antes del turno 15.', reglasDesafio: { maxTurnos: 15 } }
];

const TORNEO_CONFIG = {
  rondas: 3,
  dificultadesPorRonda: ['facil', 'intermedio', 'jarcor']
};
