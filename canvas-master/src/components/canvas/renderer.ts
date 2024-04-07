import * as conf from './conf'
import { State, Pacman } from './state'
const COLORS = {
  RED: '#ff0000',
  GREEN: '#008800',
  BLUE: '#0000ff',
}

const toDoubleHexa = (n: number) =>
  n < 16 ? '0' + n.toString(16) : n.toString(16)

export const rgbaTorgb = (rgb: string, alpha = 0) => {
  let r = 0
  let g = 0
  let b = 0
  if (rgb.startsWith('#')) {
    const hexR = rgb.length === 7 ? rgb.slice(1, 3) : rgb[1]
    const hexG = rgb.length === 7 ? rgb.slice(3, 5) : rgb[2]
    const hexB = rgb.length === 7 ? rgb.slice(5, 7) : rgb[3]
    r = parseInt(hexR, 16)
    g = parseInt(hexG, 16)
    b = parseInt(hexB, 16)
  }
  if (rgb.startsWith('rgb')) {
    const val = rgb.replace(/(rgb)|\(|\)| /g, '')
    const splitted = val.split(',')
    r = parseInt(splitted[0])
    g = parseInt(splitted[1])
    b = parseInt(splitted[2])
  }

  r = Math.max(Math.min(Math.floor((1 - alpha) * r + alpha * 255), 255), 0)
  g = Math.max(Math.min(Math.floor((1 - alpha) * g + alpha * 255), 255), 0)
  b = Math.max(Math.min(Math.floor((1 - alpha) * b + alpha * 255), 255), 0)
  return `#${toDoubleHexa(r)}${toDoubleHexa(g)}${toDoubleHexa(b)}`
}

const clear = (ctx: CanvasRenderingContext2D) => {
  const { height, width } = ctx.canvas
  ctx.fillStyle = 'white'
  ctx.fillRect(0, 0, width, height)
}

export type RenderProps = {
  cellSize : number
  window : { height: number; width: number}
}


function drawPacman
  (ctx: CanvasRenderingContext2D, 
   renderProps: RenderProps,
   { x, y }: { x: number; y: number },
   direction : String) {

  const radius = 20; // Taille de Pac-Man, ajustez selon vos besoins
  const mouthOpenAngle = 0.2 * Math.PI; // Ajustez l'ouverture de la bouche de Pac-Man
  
  // Calculer l'angle de départ et de fin pour la "bouche" de Pac-Man selon sa direction
  let startAngle = 0.5 * Math.PI; // Angle de départ par défaut (vers le haut)
  let endAngle = 2.5 * Math.PI; // Angle de fin par défaut
  switch(direction) {
    case "right":
      startAngle = -mouthOpenAngle;
      endAngle = 2 * Math.PI + mouthOpenAngle;
      break;
    case "down":
      startAngle = 0.5 * Math.PI - mouthOpenAngle;
      endAngle = 0.5 * Math.PI + mouthOpenAngle;
      break;
    case "left":
      startAngle = Math.PI - mouthOpenAngle;
      endAngle = Math.PI + mouthOpenAngle;
      break;
    case "up":
      startAngle = 1.5 * Math.PI - mouthOpenAngle;
      endAngle = 1.5 * Math.PI + mouthOpenAngle;
      break;
  }

  // Dessiner Pac-Man
  ctx.beginPath();
  ctx.arc(x, y, radius, endAngle,startAngle, false); // Corps de Pac-Man
  ctx.lineTo(x, y); // Revenir au centre pour fermer la bouche
  ctx.fillStyle = "yellow"; // La couleur de Pac-Man
  ctx.fill();
  ctx.closePath();
}

const drawPiece = (
  ctx: CanvasRenderingContext2D,
  renderProps: RenderProps,
  { x, y }: { x: number; y: number },
  width : number,
) => {
  ctx.beginPath()
  ctx.fillStyle = "yellow"
  ctx.arc(x, y,
    conf.PIECERADIUS,
    0,
    2 * Math.PI
  )
  ctx.fill()
};


const drawLabyrinth = (
  ctx: CanvasRenderingContext2D,
  renderProps: RenderProps,
  maze : conf.Maze 
) => {

  maze.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      const x = colIndex * renderProps.cellSize;
      const y = rowIndex * renderProps.cellSize;

      if (cell === '#') {
        ctx.fillStyle = 'darkblue';
        ctx.fillRect(x,y,
          renderProps.cellSize,
          renderProps.cellSize
        );
      }
    });
  });
};

const diplayGameText = (ctx: CanvasRenderingContext2D) => (state: State) => {
  ctx.font = '56px arial'
  ctx.fillStyle = 'black'
  ctx.fillText(
    `Score: ${state.pacman.score}`, // Affiche le score
    20, // Position X du texte (à gauche de l'écran)
    state.cellSize * state.maze.length + 45 // Position Y du texte
  )
}

const displayWindow = (ctx: CanvasRenderingContext2D,
  x1: number,  y1: number, larg : number, haut : number,
) => {
  ctx.strokeRect(x1, y1, larg, haut)
}

const computeColor = (life: number, maxLife: number, baseColor: string) =>
  rgbaTorgb(baseColor, (maxLife - life) * (1 / maxLife))

export const render =
  (ctx: CanvasRenderingContext2D, props: RenderProps) => (state: State) => {
    clear(ctx)
    //const {height,  width } = props.window; // Get canvas dimensions
    displayWindow(ctx, 0 , 0 , state.size.width, state.size.height)
    state.pieces.map((c) =>
      drawPiece(
        ctx,
        props,
        c.coord,
        c.width
      )
    )
    drawLabyrinth(ctx, props, state.maze)
    diplayGameText(ctx)(state)
    drawPacman(ctx, props, state.pacman.coord, state.pacman.direction)
    
    if (state.endOfGame) {
      const text = 'END'
      ctx.font = '48px'
      ctx.strokeText(text, state.size.width / 2 - 100, state.size.height / 2)
    }
  }