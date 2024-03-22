import * as conf from './conf'
import { useRef, useEffect, useCallback } from 'react'
import { State, step, click, mouseMove, endOfGame, Window } from './state'
import { render, RenderProps } from './renderer'

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
    pos: new Array(6).fill(1).map((_) => ({
      life: conf.BALLLIFE,
      coord: {
        x: randomInt(width - 120) + 60,
        y: randomInt(height - 120) + 60,
        dx: 4 * randomSign(),
        dy: 4 * randomSign(),
      },
    })),
    sqr: new Array(4).fill(1).map((_) => ({
      coord: {
        x: randomInt(width - 120) + 60,
        y: randomInt(height - 120) + 60,
        dx: 4 * randomSign(),
        dy: 4 * randomSign(),
      },
      width : randomInt(30)
    })),
    size : {
      height : (height - 50) , 
      width : width - 50
    },
    endOfGame: true,
  }

  const ref = useRef<any>()
  const state = useRef<State>(initialState)
  const scaleRef = useRef<number>(1)
  const cellSizeRef = useRef<number>(Math.min(state.current.size.width / conf.maze[0].length, state.current.size.height / conf.maze.length) // Calculate cell size based on canvas and maze size
  )
  const posRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const drag = useRef<boolean>(false)
  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const downTS = useRef<number>(Date.now())
  const windowRef = useRef<Window>({height : state.current.size.height - 10,
                                    width : state.current.size.width - 10} )

  const iterate = (ctx: CanvasRenderingContext2D) => {
    state.current = step(state.current)
    state.current.endOfGame = !endOfGame(state.current)
    render(ctx, {
      pos: posRef.current,
      scale: scaleRef.current,
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
        // Gérer la flèche vers le haut
        console.log('Up arrow key pressed');
        break;
      case 'ArrowDown':
        // Gérer la flèche vers le bas
        console.log('Down arrow key pressed');
        break;
      case 'ArrowLeft':
        // Gérer la flèche gauche
        console.log('Left arrow key pressed');
        break;
      case 'ArrowRight':
        // Gérer la flèche droite
        console.log('Right arrow key pressed');
        break;
      default:
        console.log('default ');
        break;
    }
  }, []);
  

  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      const { offsetX, offsetY, deltaY } = e
      const zoomFactor = 0.98
      if (scaleRef.current > 0.5 || deltaY < 0) {
        const factor = e.deltaY > 0 ? zoomFactor : 1 / zoomFactor
        scaleRef.current = scaleRef.current * factor
        const dx = (offsetX / scaleRef.current) * (factor - 1)
        const dy = (offsetY / scaleRef.current) * (factor - 1)
        posRef.current = {
          x: posRef.current.x - dx,
          y: posRef.current.y - dy,
        }
      }
    }    
    const onDragStart = (e: PointerEvent) => {
      const { x, y } = e
      dragStart.current = { x, y }
      drag.current = true
      downTS.current = Date.now()
    }
    const onDragEnd = (_e: any) => (drag.current = false)
    const onDragMove = (e: PointerEvent) => {
      if (drag.current) {
        const { x, y } = e
        const scale = scaleRef.current
        const pos = posRef.current
        posRef.current = {
          x: (x - dragStart.current.x) / scale + pos.x,
          y: (y - dragStart.current.y) / scale + pos.y,
        }
        dragStart.current = { x, y }
      }
    }
  
    

    ref.current.addEventListener('click', onClick)
    ref.current.addEventListener('mousemove', onMove)
    ref.current.addEventListener('wheel', onWheel)
    ref.current.addEventListener('mouseupoutside', onDragEnd)
    ref.current.addEventListener('touchendoutside', onDragEnd)
    ref.current.addEventListener('mouseup', onClick)
    ref.current.addEventListener('mousemove', onDragMove)
    ref.current.addEventListener('mousedown', onDragStart)
    ref.current.addEventListener('touchstart', onDragStart)
    ref.current.addEventListener('mouseup', onDragEnd)
    ref.current.addEventListener('touchend', onDragEnd)
    ref.current.addEventListener('mousemove', onDragMove)
    ref.current.addEventListener('touchmove', onDragMove)
    ref.current.addEventListener('keydown', handleKeyDown)
    initCanvas(iterate)(ref.current)

    return () => {
      ref.current.removeEventListener('click', onMove)
      ref.current.removeEventListener('mousemove', onMove)
      ref.current.removeEventListener('wheel', onWheel)
      ref.current.removeEventListener('mouseupoutside', onDragEnd)
      ref.current.removeEventListener('touchendoutside', onDragEnd)
      ref.current.removeEventListener('mouseup', onClick)
      ref.current.removeEventListener('mousemove', onDragMove)
      ref.current.removeEventListener('mousedown', onDragStart)
      ref.current.removeEventListener('touchstart', onDragStart)
      ref.current.removeEventListener('mouseup', onDragEnd)
      ref.current.removeEventListener('touchend', onDragEnd)
      ref.current.removeEventListener('mousemove', onDragMove)
      ref.current.removeEventListener('touchmove', onDragMove)
      ref.current.removeEventListener('keydown', handleKeyDown)
    }
  }, [])
  return <canvas {...{ height, width, ref }} />
}

export default Canvas