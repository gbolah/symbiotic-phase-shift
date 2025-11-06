import { useState, useEffect, useRef, useCallback } from "react";
import logo from "@/assets/logo.png";

interface Wave {
  id: number;
  y: number;
  phase: "light" | "dark";
  speed: number;
}

const Index = () => {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [playerPhase, setPlayerPhase] = useState<"light" | "dark">("light");
  const [waves, setWaves] = useState<Wave[]>([]);
  const [intensity, setIntensity] = useState(1);
  
  const gameLoopRef = useRef<number>();
  const waveSpawnRef = useRef<number>();
  const lastSpawnTimeRef = useRef(0);
  const waveIdRef = useRef(0);

  const spawnWave = useCallback(() => {
    const newWave: Wave = {
      id: waveIdRef.current++,
      y: -50,
      phase: Math.random() > 0.5 ? "light" : "dark",
      speed: 2 + (level * 0.5),
    };
    setWaves((prev) => [...prev, newWave]);
  }, [level]);

  const checkCollision = useCallback(
    (wave: Wave) => {
      const playerY = window.innerHeight * 0.7;
      const waveHeight = 60;
      
      if (wave.y > playerY - waveHeight && wave.y < playerY + waveHeight) {
        if (wave.phase !== playerPhase) {
          setGameOver(true);
          return true;
        }
      }
      return false;
    },
    [playerPhase]
  );

  const togglePhase = useCallback(() => {
    if (!gameStarted || gameOver) return;
    setPlayerPhase((prev) => (prev === "light" ? "dark" : "light"));
  }, [gameStarted, gameOver]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        if (!gameStarted) {
          startGame();
        } else {
          togglePhase();
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [gameStarted, togglePhase]);

  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setLevel(1);
    setPlayerPhase("light");
    setWaves([]);
    setIntensity(1);
    lastSpawnTimeRef.current = Date.now();
  };

  const restartGame = () => {
    startGame();
  };

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const gameLoop = () => {
      setWaves((prevWaves) => {
        const updatedWaves = prevWaves
          .map((wave) => ({
            ...wave,
            y: wave.y + wave.speed,
          }))
          .filter((wave) => {
            if (wave.y > window.innerHeight + 50) {
              setScore((prev) => prev + 10);
              return false;
            }
            if (checkCollision(wave)) {
              return false;
            }
            return true;
          });

        return updatedWaves;
      });

      const now = Date.now();
      const spawnInterval = Math.max(800 - level * 50, 400);
      
      if (now - lastSpawnTimeRef.current > spawnInterval) {
        spawnWave();
        lastSpawnTimeRef.current = now;
      }

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameStarted, gameOver, level, spawnWave, checkCollision]);

  useEffect(() => {
    const newLevel = Math.floor(score / 100) + 1;
    setLevel(newLevel);
    setIntensity(Math.min(newLevel * 0.3, 3));
  }, [score]);

  const bgColor = playerPhase === "light" ? "bg-[#CDFF00]" : "bg-black";
  const textColor = playerPhase === "light" ? "text-black" : "text-[#CDFF00]";
  const invertColors = playerPhase === "dark";

  return (
    <div
      className={`min-h-screen w-full overflow-hidden transition-all duration-300 ${bgColor} ${textColor} relative select-none`}
      style={{
        filter: gameStarted && !gameOver ? `brightness(${1 + intensity * 0.2}) contrast(${1 + intensity * 0.1})` : "none",
      }}
      onClick={togglePhase}
    >
      {/* Header with Logo */}
      <header className="absolute top-0 left-0 right-0 z-50 p-4 sm:p-6 flex items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <img
            src={logo}
            alt="Phase Shift Logo"
            className={`w-12 h-12 sm:w-16 sm:h-16 transition-transform duration-300 ${
              gameStarted && !gameOver ? "animate-pulse" : ""
            }`}
            style={{
              filter: invertColors ? "invert(1)" : "none",
            }}
          />
          <div>
            <h1 className="text-xl sm:text-3xl font-black tracking-tighter uppercase">
              Phase Shift
            </h1>
            <p className="text-xs sm:text-sm opacity-70 font-mono">
              SYMBIOTIC REFLEX
            </p>
          </div>
        </div>
        
        {gameStarted && !gameOver && (
          <div className="text-right font-mono">
            <div className="text-2xl sm:text-4xl font-black">{score}</div>
            <div className="text-xs sm:text-sm opacity-70">LVL {level}</div>
          </div>
        )}
      </header>

      {/* Game Area */}
      <div className="relative w-full h-screen flex items-center justify-center">
        {/* Start Screen */}
        {!gameStarted && (
          <div className="text-center space-y-6 sm:space-y-8 px-4 animate-fade-in">
            <div className="space-y-2 sm:space-y-4">
              <h2 className="text-4xl sm:text-7xl font-black uppercase tracking-tighter">
                Phase Shift
              </h2>
              <p className="text-base sm:text-xl font-mono max-w-md mx-auto opacity-80">
                Match your phase to pass through waves
              </p>
            </div>
            <div className="space-y-3 sm:space-y-4 font-mono text-xs sm:text-sm opacity-70">
              <p>PRESS SPACEBAR or CLICK to toggle phase</p>
              <p>Survive the collapsing waves</p>
              <p>Intensity increases with each level</p>
            </div>
            <button
              onClick={startGame}
              className={`px-8 sm:px-12 py-3 sm:py-4 text-lg sm:text-xl font-black uppercase border-4 transition-all duration-200 hover:scale-110 ${
                playerPhase === "light"
                  ? "border-black bg-black text-[#CDFF00]"
                  : "border-[#CDFF00] bg-[#CDFF00] text-black"
              }`}
              style={{
                boxShadow: playerPhase === "light"
                  ? "0 0 20px rgba(0, 0, 0, 0.5)"
                  : "0 0 20px rgba(205, 255, 0, 0.5)",
              }}
            >
              Start Game
            </button>
          </div>
        )}

        {/* Game Over Screen */}
        {gameOver && (
          <div className="text-center space-y-6 sm:space-y-8 px-4 animate-scale-in">
            <div className="space-y-2 sm:space-y-4">
              <h2 className="text-5xl sm:text-8xl font-black uppercase tracking-tighter animate-pulse">
                Phase Lost
              </h2>
              <div className="text-3xl sm:text-6xl font-black">{score}</div>
              <p className="text-base sm:text-xl font-mono opacity-70">
                Level {level} reached
              </p>
            </div>
            <button
              onClick={restartGame}
              className={`px-8 sm:px-12 py-3 sm:py-4 text-lg sm:text-xl font-black uppercase border-4 transition-all duration-200 hover:scale-110 ${
                playerPhase === "light"
                  ? "border-black bg-black text-[#CDFF00]"
                  : "border-[#CDFF00] bg-[#CDFF00] text-black"
              }`}
              style={{
                boxShadow: playerPhase === "light"
                  ? "0 0 20px rgba(0, 0, 0, 0.5)"
                  : "0 0 20px rgba(205, 255, 0, 0.5)",
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Active Game */}
        {gameStarted && !gameOver && (
          <>
            {/* Player */}
            <div
              className="absolute left-1/2 -translate-x-1/2 w-16 h-16 sm:w-20 sm:h-20 transition-all duration-200"
              style={{
                top: "70%",
                backgroundColor: playerPhase === "light" ? "#000000" : "#CDFF00",
                boxShadow: playerPhase === "light"
                  ? `0 0 ${20 + intensity * 10}px rgba(0, 0, 0, 0.8)`
                  : `0 0 ${20 + intensity * 10}px rgba(205, 255, 0, 0.8)`,
                transform: `translateX(-50%) scale(${1 + intensity * 0.1})`,
              }}
            />

            {/* Waves */}
            {waves.map((wave) => (
              <div
                key={wave.id}
                className="absolute left-0 w-full h-16 transition-opacity duration-200"
                style={{
                  top: `${wave.y}px`,
                  backgroundColor: wave.phase === "light" ? "#000000" : "#CDFF00",
                  opacity: 0.6 + intensity * 0.1,
                  boxShadow: wave.phase === "light"
                    ? `0 0 ${30 + intensity * 10}px rgba(0, 0, 0, 0.5)`
                    : `0 0 ${30 + intensity * 10}px rgba(205, 255, 0, 0.5)`,
                }}
              >
                <div className="w-full h-full flex items-center justify-center font-mono text-xs sm:text-sm font-black">
                  {wave.phase === "light" ? (
                    <span style={{ color: "#CDFF00" }}>LIGHT PHASE</span>
                  ) : (
                    <span style={{ color: "#000000" }}>DARK PHASE</span>
                  )}
                </div>
              </div>
            ))}

            {/* Phase Indicator */}
            <div className="absolute bottom-8 sm:bottom-12 left-1/2 -translate-x-1/2 text-center font-mono">
              <div className="text-lg sm:text-2xl font-black uppercase mb-2">
                {playerPhase} Phase
              </div>
              <div className="text-xs sm:text-sm opacity-70">
                CLICK or SPACE to shift
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Index;
