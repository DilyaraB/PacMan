import * as conf from './conf'
import { Coord, Size} from './state'

export type Pacman = { 
    coord: Coord; 
    radius: number;
    invincible: number; 
    direction: "up" | "down" | "left" | "right";
    score: number;
  }

export const updatePacmanPosition = (bound: Size) => (maze: conf.Maze) => (pacman: Pacman) => (cellSize: number) => {
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


  // Fonction pour trouver la position de départ de Pac-Man sur l'avant-dernière ligne du labyrinthe
export const findPacmanStartPosition = (maze: conf.Maze, cellSize: number): { x: number; y: number } => {
    const y = maze.length - 2; // Index de l'avant-dernière ligne
    for (let x = 0; x < maze[y].length; x++) {
      if (maze[y][x] === ' ') { // Trouver le premier bloc vide sur cette ligne
        return {
          x: x * cellSize + cellSize / 2, // Centrer Pac-Man dans la cellule
          y: y * cellSize + cellSize / 2
        };
      }
    }
    throw new Error('No valid starting position found on the second last row of the maze.');
  };