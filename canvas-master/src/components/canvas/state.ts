import * as conf from './conf'
type Coord = { x: number; y: number; dx: number; dy: number }
type Ball = { coord: Coord; life: number; invincible?: number }
type Size = { height: number; width: number }
type Square = { coord: Coord; width : number}
export type Window = { height: number; width: number}

export type State = {
  pos: Array<Ball>
  sqr : Array<Square>
  size: Size
  endOfGame: boolean
}

const dist2 = (o1: Coord, o2: Coord) =>
  Math.pow(o1.x - o2.x, 2) + Math.pow(o1.y - o2.y, 2)

const iterate = (bound: Size) => (ball: Ball) => {
  const invincible = ball.invincible ? ball.invincible - 1 : ball.invincible
  const coord = ball.coord
  const dx =
    (coord.x + conf.RADIUS > bound.width || coord.x < conf.RADIUS
      ? -coord.dx
      : coord.dx) * conf.FRICTION
  const dy =
    (coord.y + conf.RADIUS > bound.height || coord.y < conf.RADIUS
      ? -coord.dy
      : coord.dy) * conf.FRICTION
  if (Math.abs(dx) + Math.abs(dy) < conf.MINMOVE)
    return { ...ball, invincible, coord: { ...coord, dx: 0, dy: 0 } }
  return {
    ...ball,
    invincible,
    coord: {
      x: coord.x + dx,
      y: coord.y + dy,
      dx,
      dy,
    },
  }
}

export const click =
  (state: State) =>
  (event: PointerEvent): State => {
    const { offsetX, offsetY } = event
    const target = state.pos.find(
      (p) =>
        dist2(p.coord, { x: offsetX, y: offsetY, dx: 0, dy: 0 }) <
        Math.pow(conf.RADIUS, 2) + 100
    )
    if (target) {
      target.coord.dx += Math.random() * 10
      target.coord.dy += Math.random() * 10
    }
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

const collideBoingCS = (p1: Ball, p2: Square) => {
  // Si la collision est détectée, ajustez la position du cercle pour qu'il ne passe pas à travers le carré
  const dx = p1.coord.x - p2.coord.x;
  const dy = p1.coord.y - p2.coord.y;
  const angle = Math.atan2(dy, dx);
  const dist = Math.sqrt(dx * dx + dy * dy);
  const minDist = conf.RADIUS + p2.width / 2;

  // Calcul de la nouvelle position du cercle
  const newX = p2.coord.x + Math.cos(angle) * minDist;
  const newY = p2.coord.y + Math.sin(angle) * minDist;

  // Mise à jour de la position du cercle
  p1.coord.x = newX;
  p1.coord.y = newY;

  // Calcul de la vitesse réfléchie du cercle par rapport au carré
  const dotProduct = (p1.coord.dx * dx + p1.coord.dy * dy) / dist;
  p1.coord.dx = p1.coord.dx - 2 * dotProduct * dx / dist;
  p1.coord.dy = p1.coord.dy - 2 * dotProduct * dy / dist;
}

const collideCircleSquare = (circle: Ball, square: Square) => {
  // Vérifier si le centre du cercle est à l'intérieur du carré
  const insideX = circle.coord.x >= square.coord.x && circle.coord.x <= square.coord.x + square.width;
  const insideY = circle.coord.y >= square.coord.x && circle.coord.y <= square.coord.y + square.width;
  if (insideX && insideY) {
    return true;
  }

  // Vérifier si le cercle et le carré se chevauchent
  let closestX = clamp(circle.coord.x, square.coord.x, square.coord.x + square.width);
  let closestY = clamp(circle.coord.y, square.coord.y , square.coord.y + square.width);
  let distanceX = circle.coord.x - closestX;
  let distanceY = circle.coord.y - closestY;
  let distanceSquared = distanceX * distanceX + distanceY * distanceY;
  return distanceSquared < (conf.RADIUS * conf.RADIUS);
}

// Fonction utilitaire pour limiter une valeur à un intervalle
const clamp = (value: number, min: number, max: number) => {
  return Math.max(min, Math.min(value, max));
}


export const step = (state: State) => {
  state.pos.map((p1, i, arr) => {
    arr.slice(i + 1).map((p2) => {
      if (collide(p1.coord, p2.coord)) {
        if (!p1.invincible) {
          p1.life--;
          p1.invincible = 20;
        }
        if (!p2.invincible) {
          p2.life--;
          p2.invincible = 20;
        }
        collideBoing(p1.coord, p2.coord);
      }
    });
    state.sqr.map((p2) => { // Utilisation correcte de map pour parcourir les carrés
      if (collideCircleSquare(p1, p2)) {
        if (!p1.invincible) {
          p1.life--;
          p1.invincible = 20;
        }
        collideBoingCS(p1, p2);
      }
    });
  });
  return {
    ...state,
    pos: state.pos.map(iterate(state.size)).filter((p) => p.life > 0),
  };
};


export const mouseMove =
  (state: State) =>
  (event: PointerEvent): State => {
    return state
  }

export const endOfGame = (state: State): boolean => state.pos.length > 0
