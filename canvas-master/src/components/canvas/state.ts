import * as conf from './conf'

import { updatePacmanPosition, Pacman } from './state_pacman'
import { Ghost, resetGhostPosition, updateGhostsPosition} from './state_ghost'


export type Coord = { x: number; y: number;}
export type Size = { height: number; width: number }

type Piece = { 
  coord: Coord; 
  radius: number; 
  life: number;
  invincible: boolean
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


const collidePacmanPiece = (pacman: Pacman, piece: Piece): boolean => {
  const dx = pacman.coord.x - piece.coord.x;
  const dy = pacman.coord.y - piece.coord.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  return distance < (pacman.radius + piece.radius);
};

const collidePacmanGhost = (pacman: Pacman, ghost: Ghost): boolean => {
  const dx = pacman.coord.x - ghost.coord.x;
  const dy = pacman.coord.y - ghost.coord.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  return distance < (pacman.radius + ghost.radius);
};


export const endOfGame = (state: State): boolean => state.pieces.length > 0


export const generatePieces = (maze: conf.Maze, cellSize: number) => {
  const pieces = [];

  for (let row = 0; row < maze.length; row++) {
    for (let col = 0; col < maze[row].length; col++) {
      if (maze[row][col] === ' ') {
        // position centrale de la cellule pour placer la pièce
        const centerX = col * cellSize + cellSize / 2;
        const centerY = row * cellSize + cellSize / 2;
        //piece invincible = gommes
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
        state.pacman.invincible = conf.ghostInvisibleTime; 
        state.ghosts.forEach(ghost => ghost.invincible = conf.ghostInvisibleTime); 
      }
    }
  });

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