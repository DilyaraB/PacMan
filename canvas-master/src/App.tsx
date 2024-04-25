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
  const [gameStarted, setGameStarted] = useState(false);

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

  const startGame = () => {
    setGameStarted(true);  // Mettre à jour l'état pour démarrer le jeu
  };

  return (
    <div className="App" ref={container}>
      {size ? (
        gameStarted ? (
          <Canvas {...size }/>  // Afficher le jeu si démarré
        ) : (
          <div className="start-screen">
            <button className="start-button" onClick={startGame}>Start</button>
          </div>
        )
      ) : (
        <Loader />  // Afficher le loader si la taille n'est pas encore définie
      )}
    </div>
  );
};

export default App
