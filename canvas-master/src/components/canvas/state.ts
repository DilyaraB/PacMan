import * as conf from './conf'
type Coord = { x: number; y: number; dx: number; dy: number }
type Size = { height: number; width: number }
type Piece = { coord: Coord; width: number; life: number}
export type Window = { height: number; width: number}


export type Pacman = { 
  coord: Coord; 
  invincible?: number; 
  direction: "up" | "down" | "left" | "right";
  score: number;
}

export type State = {
  pieces : Array<Piece>
  pacman : Pacman
  size: Size
  cellSize : number
  maze : conf.Maze
  endOfGame: boolean
}

const dist2 = (o1: Coord, o2: Coord) =>
  Math.pow(o1.x - o2.x, 2) + Math.pow(o1.y - o2.y, 2)

// const iterate = (bound: Size) => (ball: Ball) => {
//   const invincible = ball.invincible ? ball.invincible - 1 : ball.invincible
//   const coord = ball.coord
//   const dx =
//     (coord.x + conf.RADIUS > bound.width || coord.x < conf.RADIUS
//       ? -coord.dx
//       : coord.dx) * conf.FRICTION
//   const dy =
//     (coord.y + conf.RADIUS > bound.height || coord.y < conf.RADIUS
//       ? -coord.dy
//       : coord.dy) * conf.FRICTION
//   if (Math.abs(dx) + Math.abs(dy) < conf.MINMOVE)
//     return { ...ball, invincible, coord: { ...coord, dx: 0, dy: 0 } }
//   return {
//     ...ball,
//     invincible,
//     coord: {
//       x: coord.x + dx,
//       y: coord.y + dy,
//       dx,
//       dy,
//     },
//   }
// }

export const click =
  (state: State) =>
  (event: PointerEvent): State => {
    const { offsetX, offsetY } = event
    // const target = state.pos.find(
    //   (p) =>
    //     dist2(p.coord, { x: offsetX, y: offsetY, dx: 0, dy: 0 }) <
    //     Math.pow(conf.RADIUS, 2) + 100
    // )
    // if (target) {
    //   target.coord.dx += Math.random() * 10
    //   target.coord.dy += Math.random() * 10
    // }
    return state
  }

const collide = (o1: Coord, o2: Coord) =>
  dist2(o1, o2) < Math.pow(2 * conf.RADIUS, 2)

const collideBoing = (p1: Coord, p2: Coord) => {
  const nx = (p2.x - p1.x) / (2 * conf.RADIUS)
  const ny = (p2.y - p1.y) / (2 * conf.RADIUS)
  const gx = -ny
  const gy = nx

  const v1g = gx * p1.dx + gy * p1.dy
  const v2n = nx * p2.dx + ny * p2.dy
  const v2g = gx * p2.dx + gy * p2.dy
  const v1n = nx * p1.dx + ny * p1.dy
  p1.dx = nx * v2n + gx * v1g
  p1.dy = ny * v2n + gy * v1g
  p2.dx = nx * v1n + gx * v2g
  p2.dy = ny * v1n + gy * v2g
  p1.x += p1.dx
  p1.y += p1.dy
  p2.x += p2.dx
  p2.y += p2.dy
}


const collidePacmanPiece = (pacman: Pacman, piece: Piece) => {
  // Vérifier si le centre du cercle est à l'intérieur du carré
  const insideX = pacman.coord.x >= piece.coord.x && pacman.coord.x <= piece.coord.x + piece.width;
  const insideY = pacman.coord.y >= piece.coord.x && pacman.coord.y <= piece.coord.y + piece.width;
  if (insideX && insideY) {
    return true;
  }

  // Vérifier si le cercle et le carré se chevauchent
  let closestX = clamp(pacman.coord.x, piece.coord.x, piece.coord.x + piece.width);
  let closestY = clamp(pacman.coord.y, piece.coord.y , piece.coord.y + piece.width);
  let distanceX = pacman.coord.x - closestX;
  let distanceY = pacman.coord.y - closestY;
  let distancepiece = distanceX * distanceX + distanceY * distanceY;
  return distancepiece < (conf.PIECERADIUS * conf.RADIUS);
}

// Fonction utilitaire pour limiter une valeur à un intervalle
const clamp = (value: number, min: number, max: number) => {
  return Math.max(min, Math.min(value, max));
}



export const step = (state: State) => {
  
  state.pieces.map((p) => { // Utilisation correcte de map pour parcourir les carrés
    if (collidePacmanPiece(state.pacman, p)) {
      state.pacman.score++;
      p.life--;
    }
  });
  
  return {
    ...state,
    pieces: state.pieces.filter((p) => p.life > 0),
    pacman : updatePacmanPosition(state.size)(state.maze)(state.pacman)(state.cellSize),
  };
};


function collidePacmanMaze(maze: conf.Maze, newX: number, newY: number, cellSize: number): boolean {
  const col = Math.floor(newX / cellSize);
  const row = Math.floor(newY / cellSize);

  if (maze[row] && maze[row][col] !== '#') {
    return true; // Pas un mur, la position est valide
  }
  return false; // Collision avec un mur
}

const updatePacmanPosition = (bound: Size) => (maze: conf.Maze) => (pacman: Pacman) => (cellSize: number)=>{
  let { x, y } = pacman.coord;
  let direction = pacman.direction;
  const speed = 3; // Vitesse de déplacement de Pac-Man, ajustez selon vos besoins
  // Calculer la position de grille de Pac-Man
  let targetX = Math.floor(x / cellSize);
  let targetY = Math.floor(y / cellSize);

  // Déterminer la cellule cible en fonction de la direction
  switch (direction) {
    case "up":    targetY -= 1; break;
    case "down":  targetY += 1; break;
    case "left":  targetX -= 1; break;
    case "right": targetX += 1; break;
  }

  // Vérifier si la cellule cible est un mur
  if (maze[targetY] && maze[targetY][targetX] === '#') {
    console.log("pacman rencontre un mur")
    console.log("x = ", targetX, " y = ", targetY)
    return {
      ...pacman,
      coord: { ...pacman.coord, x, y },
    }; // Collision: Pac-Man ne peut pas bouger dans cette direction
  }

  // // Mettre à jour la position de Pac-Man en fonction de sa direction
  switch (direction) {
    case "up":
      y -= speed;
      break;
    case "down":
      y += speed;
      break;
    case "left":
      x -= speed;
      break;
    case "right":
      x += speed;
      break;
  }

  // Assurer que Pac-Man reste dans les limites du jeu
  x = Math.max(conf.RADIUS, Math.min(x, bound.width - conf.RADIUS));
  y = Math.max(conf.RADIUS, Math.min(y, bound.height - conf.RADIUS));

  return {
    ...pacman,
    coord: { ...pacman.coord, x, y },
  };
}
export const mouseMove =
  (state: State) =>
  (event: PointerEvent): State => {
    return state
  }

export const endOfGame = (state: State): boolean => state.pieces.length > 0
