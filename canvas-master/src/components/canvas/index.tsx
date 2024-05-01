import * as conf from './conf'
import { useRef, useEffect, useCallback } from 'react'
import { State, step, generatePieces} from './state'
import { findPacmanStartPosition } from './state_pacman'
import { generateGhosts } from './state_ghost'
import { render } from './renderer'


const initCanvas =
  (iterate: (ctx: CanvasRenderingContext2D) => void) =>
  (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    requestAnimationFrame(() => iterate(ctx))
  }


const Canvas = ({ height, width, onGameOver }: { height: number; width: number; onGameOver: (score: number) => void }) => {
  
  const initialState: State = {
    pieces: generatePieces(
      conf.maze, 
      Math.min(width / conf.maze[0].length, height / conf.maze.length)),
    ghosts : generateGhosts(
      conf.maze,
      Math.min(width / conf.maze[0].length, height / conf.maze.length),
      3),
    pacman: {
      coord: findPacmanStartPosition(
        conf.maze,
        Math.min(width / conf.maze[0].length, height / conf.maze.length)),
      radius: ((Math.min(width / conf.maze[0].length, height / conf.maze.length))/2) - 3,
      invincible: 0,
      direction: "right", 
      score: 0
    },
    size : {
      height : height, 
      width : width
    },
    cellSize: Math.min(width / conf.maze[0].length, height / conf.maze.length),
    maze : conf.maze,
    endOfGame: false,
  }

  const ref = useRef<any>()
  const state = useRef<State>(initialState)
  
  /* ------------------------------------------------------------ */

  const iterate = useCallback((ctx: CanvasRenderingContext2D) => {
    state.current = step(state.current);
    render(ctx, {
      cellSize: state.current.cellSize,
      window: state.current.size,
    })(state.current);
    if (state.current.endOfGame) {
      setTimeout(() => {
        onGameOver(state.current.pacman.score);
      }, 1000); // délai de 1 seconde
      return;
    }
    requestAnimationFrame(() => iterate(ctx));
  }, [onGameOver]);

  /* ------------------------------------------------------------ */

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
    const currentRef = ref.current; 
    if (currentRef) {
      currentRef.focus();  //focus sur le canvas dès que le composant est monté
  
      // Préchargement des images de fantômes
      conf.ghostImages.pink.src = 'images/pink.png';
      conf.ghostImages.pink.onerror = (error) => {
        console.error('Failed to load pink ghost image', error);
      };
      conf.ghostImages.red.src = 'images/red.png';
      conf.ghostImages.green.src = 'images/green.png';
      conf.ghostImages.edible.src = 'images/edible.png';
  
      currentRef.addEventListener('keydown', handleKeyDown);
      initCanvas(iterate)(currentRef);
    }
  
    return () => {
      if (currentRef) {
        currentRef.removeEventListener('keydown', handleKeyDown);
      }
    };
    // Ajouter handleKeyDown et iterate aux dépendances pour garantir qu'ils sont à jour
  }, [handleKeyDown, iterate])
  return <canvas tabIndex={0} {...{ height, width, ref }} />
}

export default Canvas