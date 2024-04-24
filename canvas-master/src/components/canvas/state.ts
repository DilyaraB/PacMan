import * as conf from './conf'
type Coord = { x: number; y: number;}
type Size = { height: number; width: number }



type Piece = { 
  coord: Coord; 
  radius: number; 
  life: number;
  invincible: boolean
}

export type Pacman = { 
  coord: Coord; 
  radius: number;
  invincible: number; 
  direction: "up" | "down" | "left" | "right";
  score: number;
}

type StepChoice = 'chase' | 'ambush' | 'random';
type GhostType = 'pink' | 'red' | 'green';

const ghostTypes: Record<StepChoice, GhostType> = {
  "chase": "red",
  "ambush": "pink",
  "random": "green"
};

type Ghost = { 
  coord: Coord; 
  initialCoord : Coord;
  radius: number;
  invincible : number; 
  stepChoice : StepChoice;
  type : GhostType;
  life:number;
  lastDirection?: { x: number; y: number }; //pour fantome qui utilise random movement
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

export const click =
  (state: State) =>
  (event: PointerEvent): State => {
    const { offsetX, offsetY } = event
    return state
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
  const radius = pacman.radius - 3; //On diminue la taille pour faciliter le changement de direction
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
        //invincible avec la probabilité de 3%
        const invincible = Math.random() < 0.03;

        pieces.push({
          coord: {
            x: centerX,
            y: centerY,
          },
          radius: cellSize/6,
          life: 1 ,
          invincible: invincible
        });
      }
    }
  }
  return pieces;
};

export const generateGhosts = (maze: conf.Maze, cellSize: number, numberOfGhosts: number): Ghost[] => {
  const ghosts: Ghost[] = [];

  const centerX = (maze[0].length / 2) * cellSize;
  const centerY = (maze.length / 2) * cellSize;
  const stepChoices: StepChoice[] = ["chase", "ambush", "random"];
  
  // Créer des fantômes espacés horizontalement
  for (let i = 0; i < numberOfGhosts; i++) {
    const x = centerX + (i - Math.floor(numberOfGhosts / 2)) * cellSize;
    const stepChoice: StepChoice = stepChoices[i % stepChoices.length];
    const ghostType: GhostType = ghostTypes[stepChoice];
    ghosts.push({
      coord: { x: x, y: centerY },
      initialCoord: { x: x, y: centerY },
      radius: cellSize / 2 - 1,
      invincible: 0,
      stepChoice,
      type: ghostType,
      life: 1,
      lastDirection: undefined
    });
  }

  return ghosts;
};



const heuristic = (pointA: Coord, pointB: Coord) => {
  // Distance Manhattan
  return Math.abs(pointA.x - pointB.x) + Math.abs(pointA.y - pointB.y);
}


const getNeighbors = (point: Coord, maze: conf.Maze) => {
  const directions = [
    { x: 1, y: 0 }, { x: -1, y: 0 }, // Droite, Gauche
    { x: 0, y: 1 }, { x: 0, y: -1 }  // Bas, Haut
  ];
  const neighbors: Coord[] = [];

  for (const direction of directions) {
    const neighbor = { x: point.x + direction.x, y: point.y + direction.y };
    if (maze[neighbor.y] && maze[neighbor.y][neighbor.x] === ' ') { // ' ' indique un chemin praticable
      neighbors.push(neighbor);
    }
  }
  return neighbors;
}

    
const aStar = (maze: conf.Maze, start: Coord, goal: Coord) => {
  const openSet = new Set<Coord>();
  const cameFrom = new Map<string, Coord>();
  const gScore = new Map<string, number>();
  const fScore = new Map<string, number>();

  const pointKey = (p: Coord) => `${p.x},${p.y}`;

  openSet.add(start);
  gScore.set(pointKey(start), 0);
  fScore.set(pointKey(start), heuristic(start, goal));

  while (openSet.size > 0) {
    let current = Array.from(openSet).reduce((a, b) => (fScore.get(pointKey(a)) ?? Infinity) < (fScore.get(pointKey(b)) ?? Infinity) ? a : b);

    if (current.x === goal.x && current.y === goal.y) {
      const path: Coord[] = [];
      while (current) {
        path.unshift(current);
        current = cameFrom.get(pointKey(current))!;
      }
      return path;
    }

    openSet.delete(current);
    for (const neighbor of getNeighbors(current, maze)) {
      const tentativeGScore = (gScore.get(pointKey(current)) ?? Infinity) + 1; // coût uniforme pour chaque déplacement
      if (tentativeGScore < (gScore.get(pointKey(neighbor)) ?? Infinity)) {
        cameFrom.set(pointKey(neighbor), current);
        gScore.set(pointKey(neighbor), tentativeGScore);
        fScore.set(pointKey(neighbor), tentativeGScore + heuristic(neighbor, goal));
        openSet.add(neighbor);
      }
    }
  }

  return []; // Aucun chemin trouvé
}

const ambushGoal = (pacman: Pacman, lookahead: number, maze: conf.Maze, cellSize: number): Coord => {
  let targetX = pacman.coord.x;
  let targetY = pacman.coord.y;

  // Ajuster la position cible selon la direction de Pacman et le lookahead
  switch (pacman.direction) {
    case "up": targetY -= lookahead * cellSize; break;
    case "down": targetY += lookahead * cellSize; break;
    case "left": targetX -= lookahead * cellSize; break;
    case "right": targetX += lookahead * cellSize; break;
  }

  // Convertir en coordonnées de la grille
  const gridX = Math.floor(targetX / cellSize);
  const gridY = Math.floor(targetY / cellSize);

  // Vérifier si la cible est dans un mur ou en dehors des limites, et ajuster si nécessaire
  if (gridY >= 0 && gridY < maze.length && gridX >= 0 && gridX < maze[gridY].length && maze[gridY][gridX] === ' ') {
    // La cible est dans un espace ouvert et valide
    return { x: gridX, y: gridY };
  } else {
    // Revenir à la position initiale si la position cible n'est pas valide
    return { x: Math.floor(pacman.coord.x / cellSize), y: Math.floor(pacman.coord.y / cellSize) };
  }
};

function randomGoal(ghost: Ghost, maze: conf.Maze): Coord {
  // Utilisez la dernière direction si elle est définie et valide
  if (ghost.lastDirection && maze[ghost.coord.y + ghost.lastDirection.y] && maze[ghost.coord.y + ghost.lastDirection.y][ghost.coord.x + ghost.lastDirection.x] === ' ') {
    return { x: ghost.coord.x + ghost.lastDirection.x, y: ghost.coord.y + ghost.lastDirection.y };
  } else {
    // Choisissez une nouvelle direction aléatoire
    const directions = [
      { x: 1, y: 0 }, { x: -1, y: 0 },
      { x: 0, y: 1 }, { x: 0, y: -1 }
    ];
    // Mélanger les directions et choisir une nouvelle direction
    const randomDirection = directions[Math.floor(Math.random() * directions.length)];
    ghost.lastDirection = randomDirection; // Mémoriser la dernière direction choisie

    const newX = ghost.coord.x + randomDirection.x;
    const newY = ghost.coord.y + randomDirection.y;

    if (newX >= 0 && newX < maze[0].length && newY >= 0 && newY < maze.length && maze[newY][newX] === ' ') {
      return { x: newX, y: newY };
    } else {
      // Restez à la position actuelle si la direction aléatoire n'est pas valide
      return { x: ghost.coord.x, y: ghost.coord.y };
    }
  }
}


   
// Conversion de coordonnées pixel en coordonnées de grille
const pixelToGrid = (pixelCoord: number, cellSize: number): number => {
  return Math.floor(pixelCoord / cellSize);
};

const gridToPixel = (gridCoord: number, cellSize: number): number => {
  return gridCoord * cellSize + cellSize / 2;
};

const updateGhostPosition = (bound: Size) => (maze: conf.Maze) => (pacman: Pacman) => (ghost: Ghost) => (cellSize: number): Ghost => {
  let gridX = pixelToGrid(ghost.coord.x, cellSize);
  let gridY = pixelToGrid(ghost.coord.y, cellSize);
  let pacmanGridX = pixelToGrid(pacman.coord.x, cellSize);
  let pacmanGridY = pixelToGrid(pacman.coord.y, cellSize);

  let goal;

  switch (ghost.stepChoice) {
    case "chase":
      goal = { x: pacmanGridX, y: pacmanGridY };
      break;
    case "ambush":
      goal = ambushGoal(pacman, 3, maze, cellSize);
      break;
    case "random":
      if (Math.random() < 0.3) {
        goal = randomGoal(ghost,maze);
      } else {
        goal = { x: pacmanGridX, y: pacmanGridY };
      }
      break;
    default:
      goal = { x: pacmanGridX, y: pacmanGridY };
  }

  const start = { x: gridX, y: gridY };
  const path = aStar(maze, start, goal); // Utiliser les coordonnées de grille pour A*
  const ghostSpeed = 2; 

  if (path.length > 1) {
    const nextPosition = path[1]; // Prochaine position en coordonnées de grille
    const targetPixelX = gridToPixel(nextPosition.x, cellSize); // Convertir en pixels pour le placement
    const targetPixelY = gridToPixel(nextPosition.y, cellSize);

    // Calculer la direction du mouvement nécessaire
    const deltaX = targetPixelX - ghost.coord.x;
    const deltaY = targetPixelY - ghost.coord.y;

    // Déplacer le fantôme par la valeur de 'ghostSpeed' pixels vers la cible
    if (Math.abs(deltaX) > ghostSpeed) {
      // Mouvement horizontal
      ghost.coord.x += Math.sign(deltaX) * ghostSpeed;
    } else if (Math.abs(deltaX) <= ghostSpeed && deltaX !== 0) {
      // Aligner parfaitement avec la grille avant de tourner
      ghost.coord.x = targetPixelX;
    }

    if (Math.abs(deltaY) > ghostSpeed) {
      // Mouvement vertical
      ghost.coord.y += Math.sign(deltaY) * ghostSpeed;
    } else if (Math.abs(deltaY) <= ghostSpeed && deltaY !== 0) {
      // Aligner parfaitement avec la grille avant de tourner
      ghost.coord.y = targetPixelY;
    }
  }

  // Garantir que le fantôme reste dans les limites
  ghost.coord.x = Math.max(0, Math.min(ghost.coord.x, bound.width - cellSize));
  ghost.coord.y = Math.max(0, Math.min(ghost.coord.y, bound.height - cellSize));

  return {
    ...ghost,
    coord: { ...ghost.coord },
  };
};



export const updateGhostsPosition = (bound: Size) => (maze: conf.Maze) => (pacman: Pacman) => (ghosts: Ghost[]) => (cellSize: number): Ghost[] => {
  return ghosts.map(ghost => updateGhostPosition(bound)(maze)(pacman)(ghost)(cellSize));
};


function resetGhostPosition(ghost : Ghost) {
  ghost.coord = {...ghost.initialCoord}; // Cloner pour éviter la modification directe
}

export const step = (state: State) => {
  
  state.ghosts.forEach((ghost) => {
    if (collidePacmanGhost(state.pacman, ghost)) {
      if (ghost.invincible == 0){
        state.endOfGame = true;
      }
      else{
        if (state.pacman.invincible > 0) {
          state.pacman.score += 50; 
          resetGhostPosition(ghost);
          ghost.invincible = 0;
        } 
      }
    }
  });

  state.pieces.map((p) => { 
    if (collidePacmanPiece(state.pacman, p)) {
      state.pacman.score++;
      p.life--;
      if (p.invincible) {
        state.pacman.invincible = 800; // Durée de l'invincibilité
        state.ghosts.forEach(ghost => ghost.invincible = 800); // Rendre les fantômes vulnérables pour que pacman puisse les manger
      }
    }
  });

  // Décrémenter le temps d'invincibilité
  if (state.pacman.invincible) {
    state.pacman.invincible -= 1;
    state.ghosts.forEach(ghost => {
      if (ghost.invincible) ghost.invincible -= 1;
    });
  }
  
  return {
    ...state,
    pieces: state.pieces.filter((p) => p.life > 0),
    pacman : updatePacmanPosition(state.size)(state.maze)(state.pacman)(state.cellSize),
    ghosts: updateGhostsPosition(state.size)(state.maze)(state.pacman)(state.ghosts)(state.cellSize),
  };
};