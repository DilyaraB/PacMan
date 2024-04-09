import { useRef, useEffect, useState } from 'react'
import Loader from './components/loader'
import Canvas from './components/canvas'
import './App.css'
import * as conf from './components/canvas/conf'

type Size = {
  height: number
  width: number
}
const App = () => {
  const [size, setSize] = useState<Size | null>(null)
  const container = useRef<any>()
  useEffect(() => {
    function updateSize() {
      const height = container.current?.clientHeight ?? 0;
      const width = container.current?.clientWidth ?? 0;
      const cellSize = Math.min(width / conf.maze2[0].length, height / conf.maze2.length);
      setSize({
        height: cellSize * conf.maze2.length,
        width: cellSize * conf.maze2[0].length,
      });
    }
    window.addEventListener('resize', updateSize);
    updateSize();
    return () => window.removeEventListener('resize', updateSize);
  }, []);
  return (
    <div className="App" ref={container}>
      {size ? <Canvas {...size} /> : <Loader />}
    </div>
  )
}

export default App
