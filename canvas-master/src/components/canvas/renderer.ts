import * as conf from './conf'
import { State } from './state'

const COLORS = {
  RED: '#ff0000',
  GREEN: '#008800',
  BLUE: '#0000ff',
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
   direction : String,
   radius: number) {

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
  radius : number,
  invincible : boolean
) => {
  ctx.beginPath();
  ctx.fillStyle = invincible ? "green" : "yellow";
  const displayRadius = invincible ? radius * 1.5 : radius; // Augmenter le rayon si invincible
  ctx.arc(x, y, 
    displayRadius, 
    0, 
    2 * Math.PI);
  ctx.fill();
};

// const drawGhost = (
//   ctx: CanvasRenderingContext2D,
//   renderProps: RenderProps,
//   { x, y }: { x: number; y: number },
//   radius: number,
//   ghostIndex: number, // Index du fantôme pour déterminer la couleur,
//   invincible : number
// ) => {
//   const colors = ["#FF0000", "#FFB8FF", "#00FFFF", "#FFB851"]; // Couleurs des fantômes
//   const invincibleColor = "#045DA6"
//   const color = invincible > 0 ? invincibleColor : colors[ghostIndex % colors.length];  // Sélectionner la default couleur en bouclant sur l'indice
//   console.log("ghost : ", ghostIndex , color)
//   ctx.beginPath();
//   ctx.fillStyle = color;
//   ctx.arc(x, y, radius, 0, 2 * Math.PI);
//   ctx.fill();
// };

function drawGhost(
  ctx: CanvasRenderingContext2D,
  { x, y }: { x: number; y: number },
  radius: number,
  ghostType: 'pink' | 'red' | 'green',
  invincible: number
) {
  const ghostImage = invincible > 0 ? conf.ghostImages.edible : conf.ghostImages[ghostType];

  if (ghostImage.complete) {
    ctx.drawImage(ghostImage, x - radius, y - radius, radius * 2, radius * 2);
  } else {
    // Si l'image n'est pas encore chargée, ajoutez un gestionnaire d'événement pour la dessiner une fois qu'elle le sera
    ghostImage.onload = () => {
      ctx.drawImage(ghostImage, x - radius, y - radius, radius * 2, radius * 2);
    };
  }
  if (invincible > 1 && invincible < 200 && ghostImage === conf.ghostImages.edible) {
    // Créer un effet de clignotement pour prévenir que le fantôme sera bientôt invincible
    const blinkInterval = 200; // Durée du clignotement en millisecondes
    const currentTime = Date.now();
    if (Math.floor(currentTime / blinkInterval) % 2 === 0) {
      ctx.drawImage(conf.ghostImages.edible, x - radius, y - radius, radius * 2, radius * 2);

    }
    else {
      // Dessiner normalement le fantôme
      ctx.drawImage(conf.ghostImages[ghostType], x - radius, y - radius, radius * 2, radius * 2);
    }
  }
}


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
        ctx.fillStyle = '#0B156A';
        ctx.fillRect(x,y,
          renderProps.cellSize,
          renderProps.cellSize
        );
      }
    });
  });
};

const displayWindow = (ctx: CanvasRenderingContext2D,
  x1: number,  y1: number, larg : number, haut : number,
) => {
  ctx.strokeRect(x1, y1, larg, haut)
}

const diplayScoreText = (ctx: CanvasRenderingContext2D) => (state: State) => {
  ctx.font = '32px "Press Start 2P", monospace'
  ctx.fillStyle = 'orange'
  ctx.fillText(
    `Score: ${state.pacman.score}`, // Affiche le score
    20, // Position X du texte (à gauche de l'écran)
    state.cellSize * state.maze.length - 9// Position Y du texte
  )
}

const displayEndText = (ctx: CanvasRenderingContext2D) => (state: State) => {
  ctx.font = '65px "Press Start 2P", monospace'
  ctx.fillStyle = 'red'
  ctx.fillText(
    `GAME OVER`, // Affiche le score
    state.size.width / 2 - 290,
    state.size.height / 2
  )
}

export const render =
  (ctx: CanvasRenderingContext2D, props: RenderProps) => (state: State) => {
    clear(ctx)
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    //const {height,  width } = props.window; // Get canvas dimensions
    displayWindow(ctx, 0 , 0 , state.size.width, state.size.height)
    state.pieces.map((c) =>
      drawPiece(
        ctx,
        props,
        c.coord,
        c.radius,
        c.invincible
      )
    )
    drawLabyrinth(ctx, props, state.maze)
    drawPacman(ctx, props, state.pacman.coord, state.pacman.direction, state.pacman.radius)
    state.ghosts.forEach((ghost, index) => {
      drawGhost(ctx, ghost.coord, ghost.radius, ghost.type, ghost.invincible);
    });

    diplayScoreText(ctx)(state)
    //console.log(state.endOfGame)
    if (state.endOfGame) {
      displayEndText(ctx)(state)
    }
  }