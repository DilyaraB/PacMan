import { useRef, useEffect, useState } from 'react'
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
  const [gameOver, setGameOver] = useState(false);
  const [finalScore, setFinalScore] = useState(0);

  const container = useRef<any>()
  useEffect(() => {
    function updateSize() {
      const height = container.current?.clientHeight ?? 0;
      const width = container.current?.clientWidth ?? 0;
      const cellSize = Math.min(width / conf.maze[0].length, height / conf.maze.length);
      setSize({
        height: cellSize * conf.maze.length,
        width: cellSize * conf.maze[0].length,
      });
    }
    window.addEventListener('resize', updateSize);
    updateSize();
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const startGame = () => {
    setGameStarted(true);
    setGameOver(false); 
  };

  const handleGameOver = (score: number) => {
    setFinalScore(score); // Stockez le score dans un état pour l'afficher sur l'écran de game over
    setGameStarted(false);
    setGameOver(true);
  };

  return (
    <div className="App" ref={container}>
    {gameOver ? (
      <div className="game-over-screen">
        <div className="overlay">
          <h1>Game Over</h1>
          <h2>Score: {finalScore}</h2>
          <button  className="retry-button" onClick={startGame}>Retry</button>
        </div>
      </div>
    ) : (
      size && !gameStarted && (
        <div className="start-screen">
          <button className="start-button" onClick={startGame}>Start</button>
        </div>
      )
    )}

    {size && gameStarted && <Canvas {...size} onGameOver={handleGameOver} />}

    {!size }
  </div>
  );
};

export default App
