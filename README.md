# Dioses en Guerra

Juego de cartas por turnos para navegador (desktop), con temática mitológica y estética oscura.

## Cómo ejecutar

1. Abre la carpeta del proyecto en tu navegador: abre `index.html` con Chrome, Firefox o Edge (o sirve la carpeta con un servidor local si lo prefieres).
2. En el menú principal puedes:
   - **Jugar vs IA**: elige dificultad (Fácil, Intermedio, Difícil, JARCOR) y empieza la partida.
   - **1 vs 1 Local**: dos jugadores en el mismo teclado; primero configura el Jugador 1, luego el Jugador 2.
   - **Reglas**: consulta las reglas básicas.
   - **Salir**: cierra la ventana (si está permitido).

## Reglas resumidas

- **Objetivo**: Gana el jugador que deja al rival **sin héroes en el mazo**. No gana por eliminar héroes del campo: cuando el rival tiene que reemplazar un héroe destruido y ya no queda ningún héroe en el mazo, pierde.
- **Mazo compartido**: Ambos jugadores roban del mismo mazo.
- **Inicio**: Cada uno roba 8 cartas y coloca:
  - **2 héroes** boca arriba en el campo.
  - **3 cartas** boca abajo (energía o trampas).
  - **3 cartas** en la mano.
- **Turno**: Tienes **2 acciones** por turno. Puedes:
  - Poner **1 carta de energía** boca abajo.
  - **Atacar** con un héroe (gastando su costo en cartas de energía).
  - Usar un **efecto** (curación, robo, antídoto, etc.).
- Después de tus acciones, robas del mazo hasta tener **3 cartas en mano**.
- **Energía**: Las cartas de energía se ponen boca abajo. Para atacar con un héroe necesitas tener al menos tantas cartas de energía como su **costo** (1, 2 o 3). Al atacar, se gastan esas cartas (van al descarte).
- **Héroes**: Tienen ataque y vida. Si la vida llega a 0, el héroe se destruye y debe reemplazarse por otro de la mano o robando del mazo hasta encontrar un héroe.

## Estructura del proyecto

- `index.html`: Menú, pantallas de setup y tablero.
- `style.css`: Estilos y animaciones (tema oscuro, bordes dorados).
- `cartas.js`: Definición de todas las cartas (héroes, energía, trampas) y funciones del mazo.
- `game.js`: Lógica del juego (estado, turnos, ataques, habilidades, victoria).
- `ia.js`: IA con 4 niveles de dificultad.
- `ui.js`: Renderizado del tablero y manejo de la interfaz.
- `script.js`: Flujo principal (menú, inicio de partida, turnos).

## Dificultades de la IA

- **Fácil**: Decisiones aleatorias.
- **Intermedio**: Prioriza atacar y elige objetivos con cierto criterio.
- **Difícil**: Evalúa ataques y prioriza energía para ataques fuertes.
- **JARCOR**: Evaluación heurística de jugadas para elegir la mejor opción disponible.

## Ilustraciones de cartas (opcional)

- Por defecto las cartas muestran un **emoji** como imagen.
- Si quieres usar ilustraciones propias, coloca las imágenes en la carpeta **`assets/cartas/`** con el nombre que tiene cada carta en `cartas.js` (campo `ilustracion`). Por ejemplo: `medusa.jpg`, `thor.jpg`, `energia.jpg`, etc.
- El juego cargará automáticamente la imagen cuando exista; si el archivo no está o falla la carga, se muestra el emoji.

## Notas

- El juego está pensado para ser **estratégico**: las decisiones del jugador determinan la partida; se evitan efectos puramente aleatorios injustos.
