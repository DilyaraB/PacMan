import * as conf from './conf'
import { useRef, useEffect, useCallback } from 'react'
import { State, step, click, mouseMove, endOfGame, generatePieces, generateGhosts } from './state'
import { render } from './renderer'

const randomInt = (max: number) => Math.floor(Math.random() * max)
const randomSign = () => Math.sign(Math.random() - 0.5)

const initCanvas =
  (iterate: (ctx: CanvasRenderingContext2D) => void) =>
  (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    requestAnimationFrame(() => iterate(ctx))
  }

// // Trouvez toutes les cellules vides dans le labyrinthe.
// const emptyCells = conf.maze2.flatMap((row, rowIndex) =>
//   row.map((cell, colIndex) => ({ x: colIndex, y: rowIndex })).filter(({ x, y }) => conf.maze2[y][x] === ' ')
// );
const Canvas = ({ height, width, onGameOver }: { height: number; width: number; onGameOver: (score: number) => void }) => {
  
  const initialState: State = {
    pieces: generatePieces(
      conf.maze2, 
      Math.min(width / conf.maze2[0].length, height / conf.maze2.length)),
    ghosts : generateGhosts(
      conf.maze2,
      Math.min(width / conf.maze2[0].length, height / conf.maze2.length),
      3),
    pacman: {
      coord: findStartPosition(
        conf.maze2,
        Math.min(width / conf.maze2[0].length, height / conf.maze2.length)),
      radius: ((Math.min(width / conf.maze2[0].length, height / conf.maze2.length))/2) - 3,
      invincible: 0,
      direction: "right", 
      score: 0
    },
    size : {
      height : height, 
      width : width
    },
    cellSize: Math.min(width / conf.maze2[0].length, height / conf.maze2.length),
    maze : conf.maze2,
    endOfGame: false,
  }

  const ref = useRef<any>()
  const state = useRef<State>(initialState)
            
  const iterate = (ctx: CanvasRenderingContext2D) => {

    state.current = step(state.current)
    //state.current.endOfGame = !endOfGame(state.current)
    render(ctx, {
      cellSize : state.current.cellSize,
      window : state.current.size,
    })(state.current)
    if (state.current.endOfGame) {
      setTimeout(() => {
        onGameOver(state.current.pacman.score); // Appeler onGameOver après un délai
      }, 4000); // Délai de 4 secondes
      return; // Arrêter la boucle d'animation
    }
    requestAnimationFrame(() => iterate(ctx));
  }

  const onClick = (e: PointerEvent) => {
    state.current = click(state.current)(e)
  }

  const onMove = (e: PointerEvent) => {
    state.current = mouseMove(state.current)(e)
  }

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowUp':
        // console.log("handleKeyDown = up")
        state.current.pacman.direction = "up";
        break;
      case 'ArrowDown':
        // console.log("handleKeyDown = down")
        state.current.pacman.direction = "down";
        break;
      case 'ArrowLeft':
        // console.log("handleKeyDown = left")
        state.current.pacman.direction = "left";
        break;
      case 'ArrowRight':
        // console.log("handleKeyDown = right")
        state.current.pacman.direction = "right";
        break;
    }
  }, []);
  

  useEffect(() => {
    if (ref.current) {
      ref.current.focus();  // Focus sur le canvas dès que le composant est monté
    }

    // Préchargement des images de fantômes
    conf.ghostImages.pink.src = 'images/pink.png';
    conf.ghostImages.pink.onerror = (error) => {
      console.error('Failed to load pink ghost image', error);
    };
    conf.ghostImages.red.src = 'images/red.png';
    conf.ghostImages.green.src = 'images/green.png';
    conf.ghostImages.edible.src = 'images/edible.png';

    ref.current.addEventListener('click', onClick)
    ref.current.addEventListener('mousemove', onMove)
    ref.current.addEventListener('mouseup', onClick)
    ref.current.addEventListener('keydown', handleKeyDown)
    
    initCanvas(iterate)(ref.current);
    return () => {
      if (ref.current) {
        ref.current.removeEventListener('click', onClick);
        ref.current.removeEventListener('mousemove', onMove);
        ref.current.removeEventListener('mouseup', onClick);
        ref.current.removeEventListener('keydown', handleKeyDown);
      }
    }
  }, [])
  return <canvas tabIndex={0} {...{ height, width, ref }} />
}

// Fonction pour trouver la position de départ de Pac-Man sur l'avant-dernière ligne du labyrinthe
const findStartPosition = (maze: conf.Maze, cellSize: number): { x: number; y: number } => {
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

export default Canvas