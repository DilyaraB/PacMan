import * as conf from './conf'
type Coord = { x: number; y: number; dx: number; dy: number }
type Size = { height: number; width: number }

type Piece = { 
  coord: Coord; 
  radius: number; 
  life: number
}

export type Pacman = { 
  coord: Coord; 
  radius: number;
  invincible?: number; 
  direction: "up" | "down" | "left" | "right";
  score: number;
}

type Ghost = { 
  coord: Coord; 
  radius: number;
  invincible?: number; 
  life:number;
}

export type State = {
  pieces : Array<Piece>
  ghosts : Array<Ghost>
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


const collidePacmanPiece = (pacman: Pacman, piece: Piece): boolean => {
  // Calculer la distance entre le centre de Pacman et le centre de la pièce
  const dx = pacman.coord.x - piece.coord.x;
  const dy = pacman.coord.y - piece.coord.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Vérifier si la distance est inférieure à la somme des rayons
  return distance < (pacman.radius + piece.radius);
};

const collidePacmanGhost = (pacman: Pacman, ghost: Ghost): boolean => {
  // Calculer la distance entre le centre de Pacman et le centre du fantome
  const dx = pacman.coord.x - ghost.coord.x;
  const dy = pacman.coord.y - ghost.coord.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Vérifier si la distance est inférieure à la somme des rayons
  return distance < (pacman.radius + ghost.radius);
};


const updatePacmanPosition = (bound: Size) => (maze: conf.Maze) => (pacman: Pacman) => (cellSize: number) => {
  let { x, y } = pacman.coord;
  const direction = pacman.direction;
  const speed = 3; // Vitesse de déplacement de Pac-Man
  const radius = pacman.radius - 2; //On diminue la taille pour faciliter le changement de chemin
  let collisionDetected = false;
  const bufferSpace = 5; // Espace supplémentaire entre Pac-Man et le mur

  // Fonction pour vérifier la collision à un point donné dans la direction de Pac-Man
  const checkCollision = (offsetX: number, offsetY: number): boolean => {
    // Ajustez pour inclure l'espace tampon dans le calcul de la collision
    const effectiveX = direction === 'left' ? offsetX - bufferSpace : direction === 'right' ? offsetX + bufferSpace : offsetX;
    const effectiveY = direction === 'up' ? offsetY - bufferSpace : direction === 'down' ? offsetY + bufferSpace : offsetY;
    const checkCol = Math.floor((x + effectiveX) / cellSize);
    const checkRow = Math.floor((y + effectiveY) / cellSize);
    return maze[checkRow] && maze[checkRow][checkCol] === '#';
  };

  // Déterminez les points de collision à l'avant de Pac-Man en fonction de la direction
  const frontOffsets = {
    "up": [{ x: -radius, y: -radius }, { x: radius, y: -radius }],
    "down": [{ x: -radius, y: radius }, { x: radius, y: radius }],
    "left": [{ x: -radius, y: -radius }, { x: -radius, y: radius }],
    "right": [{ x: radius, y: -radius }, { x: radius, y: radius }]
  }[direction];

  // Vérifiez la collision dans la direction de Pac-Man
  collisionDetected = frontOffsets.some(offset => checkCollision(offset.x, offset.y));

  // Calcule la prochaine position de Pac-Man basée sur la direction et la vitesse, s'il n'y a pas de collision détectée
  if (!collisionDetected) {
    let nextX = x + (direction === 'right' ? speed : direction === 'left' ? -speed : 0);
    let nextY = y + (direction === 'down' ? speed : direction === 'up' ? -speed : 0);

    // Mettre à jour les coordonnées de Pac-Man en tenant compte de l'espace tampon avant de vérifier les limites
    x = Math.max(radius, Math.min(nextX, bound.width - radius));
    y = Math.max(radius, Math.min(nextY, bound.height - radius));
  }

  return {
    ...pacman,
    coord: { ...pacman.coord, x, y },
  };
};


export const mouseMove =
  (state: State) =>
  (event: PointerEvent): State => {
    return state
  }

export const endOfGame = (state: State): boolean => state.pieces.length > 0


export const generatePieces = (maze: conf.Maze, cellSize: number) => {
  const pieces = [];

  // Parcourir chaque cellule du labyrinthe
  for (let row = 0; row < maze.length; row++) {
    for (let col = 0; col < maze[row].length; col++) {
      // Si la cellule est vide, placer une pièce
      if (maze[row][col] === ' ') {
        // Calculer la position centrale de la cellule pour placer la pièce
        const centerX = col * cellSize + cellSize / 2;
        const centerY = row * cellSize + cellSize / 2;

        pieces.push({
          coord: {
            x: centerX,
            y: centerY,
            dx: 0, 
            dy: 0,
          },
          radius: cellSize/5,
          life: 1 
        });
      }
    }
  }

  return pieces;
};


export const generateGhosts = (maze: conf.Maze, cellSize: number, numberOfGhosts: number): Ghost[] => {
  const ghosts: Ghost[] = [];
  
  // Calculer la position centrale du terrain
  const centerX = (maze[0].length / 2) * cellSize;
  const centerY = (maze.length / 2) * cellSize;

  for (let i = 0; i < numberOfGhosts; i++) {
    ghosts.push({
      coord: {
        x: centerX,
        y: centerY,
        // Les fantômes peuvent avoir une logique de déplacement différente, donc dx et dy pourraient être ajustés plus tard
        dx: 0, 
        dy: 0,
      },
      radius: cellSize/2 - 2, // Ajustez selon la taille visuelle souhaitée pour les fantômes
      life: 1, // La vie des fantômes; ajustez selon le besoin
      invincible: 0, // Supposons que 'invincible' indique un état spécial; ajustez comme nécessaire
    });
  }

  return ghosts;
};

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