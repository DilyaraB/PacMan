import * as conf from './conf'
import { Coord, Size} from './state'
import { Pacman } from './state_pacman'

 type StepChoice = 'chase' | 'ambush' | 'random';
 type GhostType = 'pink' | 'red' | 'green';

const ghostTypes: Record<StepChoice, GhostType> = {
  "chase": "red",
  "ambush": "pink",
  "random": "green"
};

export type Ghost = { 
  coord: Coord; 
  initialCoord : Coord;
  radius: number;
  invincible : number; 
  stepChoice : StepChoice;
  type : GhostType;
  life:number;
  lastDirection?: { x: number; y: number }; //pour fantome qui utilise random movement
}


export const generateGhosts = (maze: conf.Maze, cellSize: number, numberOfGhosts: number): Ghost[] => {
  const ghosts: Ghost[] = [];

  const centerX = (maze[0].length / 2) * cellSize;
  const centerY = (maze.length / 2) * cellSize;
  const stepChoices: StepChoice[] = ["ambush","chase","random"];
  
  for (let i = 0; i < numberOfGhosts; i++) {
    //fantômes espacés horizontalement
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

/* -------------------------------------------------------------- */

const heuristic = (pointA: Coord, pointB: Coord) => {
  // Distance Manhattan
  return Math.abs(pointA.x - pointB.x) + Math.abs(pointA.y - pointB.y);
}
  

const getNeighbors = (point: Coord, maze: conf.Maze) => {
  const directions = [
    { x: 1, y: 0 }, { x: -1, y: 0 }, // droite, gauche
    { x: 0, y: 1 }, { x: 0, y: -1 }  // bas, haut
  ];
  const neighbors: Coord[] = [];

  for (const direction of directions) {
    const neighbor = { x: point.x + direction.x, y: point.y + direction.y };
    if (maze[neighbor.y] && maze[neighbor.y][neighbor.x] === ' ') { // pas un mur
      neighbors.push(neighbor);
    }
  }
  return neighbors;
}

    
const aStar = (maze: conf.Maze, start: Coord, goal: Coord) => {
  const openSet = new Set<Coord>(); // noeuds à explorer
  const cameFrom = new Map<string, Coord>();
  const gScore = new Map<string, number>(); // cout du chemin le plus court du point de départ à un noeud donné
  const fScore = new Map<string, number>(); // cout total du chemin le moins cher du début jusqu'à la fin en passant par un noeud

  //pour faciliter le stockage et la recherche dans les Map
  const pointKey = (p: Coord) => `${p.x},${p.y}`;

  openSet.add(start);
  gScore.set(pointKey(start), 0);
  fScore.set(pointKey(start), heuristic(start, goal));

  while (openSet.size > 0) {

    // sélectionne le noeud ayant le plus faible score
    let lowestFScore = Infinity;
    let current = null;

    const pointsArray = Array.from(openSet);
    for (const point of pointsArray) {
      const fScoreValue = fScore.get(pointKey(point)) ?? Infinity;
      if (fScoreValue < lowestFScore) {
        lowestFScore = fScoreValue;
        current = point;
      }
    }

    if (current != null ){
      
      // trouve le chemin optimal et ajoute tous les noeuds dans path
      if (current.x === goal.x && current.y === goal.y) {
        const path: Coord[] = [];
        while (current) {
          path.unshift(current); //ajoute au début de path
          current = cameFrom.get(pointKey(current))!;
        }
        return path;
      }
  
      openSet.delete(current);

      //evalue chaque voisin pour mettre à jour les differents couts
      for (const neighbor of getNeighbors(current, maze)) {
        const tentativeGScore = (gScore.get(pointKey(current)) ?? Infinity) + 1;
        if (tentativeGScore < (gScore.get(pointKey(neighbor)) ?? Infinity)) {
          cameFrom.set(pointKey(neighbor), current);
          gScore.set(pointKey(neighbor), tentativeGScore);
          fScore.set(pointKey(neighbor), tentativeGScore + heuristic(neighbor, goal));
          openSet.add(neighbor);
        }
      }
    }
    
  }
  return []; 
}


const pixelToGrid = (pixelCoord: number, cellSize: number): number => {
  return Math.floor(pixelCoord / cellSize);
};

const gridToPixel = (gridCoord: number, cellSize: number): number => {
  return gridCoord * cellSize + cellSize / 2;
};

const ambushGoal = (pacman: Pacman, lookahead: number, maze: conf.Maze, cellSize: number): Coord => {
  let targetX = pacman.coord.x;
  let targetY = pacman.coord.y;

  // ajuste position cible selon la direction de Pacman et le lookahead
  switch (pacman.direction) {
    case "up": targetY -= lookahead * cellSize; break;
    case "down": targetY += lookahead * cellSize; break;
    case "left": targetX -= lookahead * cellSize; break;
    case "right": targetX += lookahead * cellSize; break;
  }

  const gridX = pixelToGrid(targetX, cellSize);
  const gridY = pixelToGrid(targetY , cellSize);

  // verifie si la cible est dans un mur ou en dehors des limites
  if (gridY >= 0 && gridY < maze.length && gridX >= 0 && gridX < maze[gridY].length && maze[gridY][gridX] === ' ') {
    return { x: gridX, y: gridY };
  } else {
    return { x: pixelToGrid(pacman.coord.x , cellSize), y: pixelToGrid(pacman.coord.y , cellSize) };
  }
};

function randomGoal(ghost: Ghost, pacman: Pacman, maze: conf.Maze, cellSize: number): Coord {

  if (ghost.lastDirection) {
    console.log('last direction: valid');

    const newX = ghost.coord.x + ghost.lastDirection.x * cellSize;
    const newY = ghost.coord.y + ghost.lastDirection.y * cellSize;

    const gridX = pixelToGrid(newX, cellSize);
    const gridY = pixelToGrid(newY, cellSize);

    //to move to new position based on lastDirection
    if (maze[gridY] && gridX >= 0 && gridX < maze[gridY].length && maze[gridY][gridX] === ' ') {
      return { x: gridX, y: gridY };
    }else{
      
      //last direction blocked, selecting a new random direction
      const directions = [
        { x: 1, y: 0 }, { x: -1, y: 0 },
        { x: 0, y: 1 }, { x: 0, y: -1 }
      ];

      const randomDirection = directions[Math.floor(Math.random() * directions.length)];
      ghost.lastDirection = randomDirection;

      const newX = ghost.coord.x + randomDirection.x * cellSize;
      const newY = ghost.coord.y + randomDirection.y * cellSize;

      const gridX = pixelToGrid(newX, cellSize);
      const gridY = pixelToGrid(newY, cellSize);

      if (maze[gridY] && gridX >= 0 && gridX < maze[gridY].length && maze[gridY][gridX] === ' ') {
        console.log('yesssss')
        return { x: gridX, y: gridY };
      }
    }
  } 

  if (!ghost.lastDirection) {
    ghost.lastDirection = { x: -1, y: 0 } //pour sortir de la maison au debut du jeu 
  }
  return { x: pixelToGrid(pacman.coord.x, cellSize), y: pixelToGrid(pacman.coord.y, cellSize) };
}


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
      goal = ambushGoal(pacman, conf.AmbushGoalLookAhead, maze, cellSize);
      break;
    case "random":
        // if (Math.random() < 0.5) {
          //console.log('randommmmmmmmm')
          goal = randomGoal(ghost,pacman,maze, cellSize);
        // } else {
        //   goal = { x: pacmanGridX, y: pacmanGridY };
        // }
      break;
    default:
      goal = { x: pacmanGridX, y: pacmanGridY };
  }

  const start = { x: gridX, y: gridY };
  const path = aStar(maze, start, goal); 

  if (path.length > 1) {
    const nextPosition = path[1];
    const targetPixelX = gridToPixel(nextPosition.x, cellSize);
    const targetPixelY = gridToPixel(nextPosition.y, cellSize);

    // direction du mouvement nécessaire
    const deltaX = targetPixelX - ghost.coord.x;
    const deltaY = targetPixelY - ghost.coord.y;

    // mouvement horizontal
    if (Math.abs(deltaX) > conf.ghostSpeed) {
      ghost.coord.x += Math.sign(deltaX) * conf.ghostSpeed;
    } else if (Math.abs(deltaX) <= conf.ghostSpeed && deltaX !== 0) {
      ghost.coord.x = targetPixelX;
    }

    // mouvement vertical
    if (Math.abs(deltaY) > conf.ghostSpeed) {
      ghost.coord.y += Math.sign(deltaY) * conf.ghostSpeed;
    } else if (Math.abs(deltaY) <= conf.ghostSpeed && deltaY !== 0) {
      ghost.coord.y = targetPixelY;
    }
  }

  // garantit que le fantôme reste dans les limites
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


export function resetGhostPosition(ghost : Ghost) {
  ghost.coord = {...ghost.initialCoord};
}
