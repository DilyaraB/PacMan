import * as conf from './conf'
import { useRef, useEffect, useCallback } from 'react'
import { State, step, click, mouseMove, endOfGame, Window, Pacman } from './state'
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

const Canvas = ({ height, width }: { height: number; width: number }) => {
  const initialState: State = {
    pieces: new Array(20).fill(1).map((_) => ({
      coord: {
        x: randomInt(width - 120) + 60,
        y: randomInt(height - 120) + 60,
        dx: 4 * randomSign(),
        dy: 4 * randomSign(),
      },
      width : randomInt(30),
      life: 1
    })),
    pacman: {
      coord: {
        x: 360,
        y: 350,
        dx: 4 * randomSign(),
        dy: 4 * randomSign(),
      },
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
    endOfGame: true,
  }

  const ref = useRef<any>()
  const state = useRef<State>(initialState)
  const cellSizeRef = useRef<number>(initialState.cellSize)
  const windowRef = useRef<Window>(initialState.size)
            
  const iterate = (ctx: CanvasRenderingContext2D) => {
    state.current = step(state.current)
    state.current.endOfGame = !endOfGame(state.current)
    render(ctx, {
      cellSize : cellSizeRef.current,
      window : windowRef.current,
    })(state.current)
    if (!state.current.endOfGame) requestAnimationFrame(() => iterate(ctx))
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

    ref.current.addEventListener('click', onClick)
    ref.current.addEventListener('mousemove', onMove)
    ref.current.addEventListener('mouseup', onClick)
    ref.current.addEventListener('keydown', handleKeyDown)
    initCanvas(iterate)(ref.current)

    return () => {
      ref.current.removeEventListener('click', onMove)
      ref.current.removeEventListener('mousemove', onMove)
      ref.current.removeEventListener('mouseup', onClick)
      ref.current.removeEventListener('keydown', handleKeyDown)
    }
  }, [])
  return <canvas tabIndex={0} {...{ height, width, ref }} />
}

export default Canvas