import React, { useState, useEffect, useCallback } from 'react';
import { generateLevel, validateChoice, playNarration, stopAudio } from './services/geminiService';
import { GameState, LevelData } from './types';
import { Typewriter } from './components/Typewriter';
import { ArtifactCard } from './components/ArtifactCard';
import { GameScene } from './components/GameScene';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    status: 'intro',
    level: 1,
    score: 0,
    currentLevelData: null,
    narrativeFeedback: null,
    history: []
  });

  const [loadingMsg, setLoadingMsg] = useState("正在向玉帝请旨...");
  const [isAudioPlaying, setIsAudioPlaying] = useState(false); // Simple tracker for UI toggle if needed

  // Animation states
  const [playerAnim, setPlayerAnim] = useState<'idle' | 'attack' | 'hit'>('idle');
  const [enemyAnim, setEnemyAnim] = useState<'idle' | 'attack' | 'hit' | 'dead'>('idle');

  // Request permissions interaction (browser policy requires user interaction for audio)
  const startGame = async () => {
    startLevel(1);
  };

  const handleStopAudio = () => {
    stopAudio();
    // Visual feedback could be added here
  };

  const startLevel = async (levelNum: number) => {
    stopAudio(); // Stop any previous narration
    setGameState(prev => ({ ...prev, status: 'loading_level' }));
    setLoadingMsg(levelNum === 1 ? "正在翻阅《西游记》..." : "正在推演下一难...");
    setPlayerAnim('idle');
    setEnemyAnim('idle');

    try {
      const data = await generateLevel(levelNum, gameState.history);
      setGameState(prev => ({
        ...prev,
        level: levelNum,
        status: 'playing',
        currentLevelData: data,
        narrativeFeedback: null
      }));
      
      // Initial Narration
      const introText = `第${data.chapter}回。${data.title}。${data.story}`;
      await playNarration(introText);

    } catch (e) {
      console.error(e);
      setLoadingMsg("信号被妖风阻断，正在重新连接...");
      setTimeout(() => startLevel(levelNum), 2000);
    }
  };

  const handleArtifactChoice = async (artifactName: string) => {
    if (gameState.status !== 'playing' || !gameState.currentLevelData) return;

    setGameState(prev => ({ ...prev, status: 'resolving' }));
    stopAudio(); // Stop intro narration if user acts quickly
    
    // Play sound effect anticipation (optional)
    setPlayerAnim('attack');

    try {
      const result = await validateChoice(gameState.currentLevelData, artifactName);
      
      setGameState(prev => ({
        ...prev,
        narrativeFeedback: result.narrative
      }));

      await playNarration(result.narrative);

      if (result.success) {
        setEnemyAnim('hit');
        setTimeout(() => setEnemyAnim('dead'), 800);
        setTimeout(() => {
          setGameState(prev => ({
            ...prev,
            status: 'success',
            score: prev.score + 100,
            history: [...prev.history, prev.currentLevelData!.enemyName]
          }));
        }, 3000); // Give time to hear success narration
      } else {
        setPlayerAnim('hit');
        setEnemyAnim('attack');
        setTimeout(() => {
          setGameState(prev => ({ ...prev, status: 'game_over' }));
        }, 2000);
      }

    } catch (e) {
      console.error(e);
      // Fallback if API fails
      setGameState(prev => ({ ...prev, status: 'playing' })); 
    }
  };

  const nextLevel = () => {
    startLevel(gameState.level + 1);
  };

  const resetGame = () => {
    stopAudio();
    setGameState({
      status: 'intro',
      level: 1,
      score: 0,
      currentLevelData: null,
      narrativeFeedback: null,
      history: []
    });
  };

  // --- RENDERERS ---

  if (gameState.status === 'intro') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center text-parchment-900">
        <h1 className="text-6xl font-serif font-bold mb-6 text-crimson drop-shadow-lg tracking-widest">西游·法宝大师</h1>
        <h2 className="text-2xl font-serif mb-8 italic text-parchment-800">取经路上的劫难与智慧</h2>
        
        <div className="max-w-xl bg-parchment-200 p-8 rounded-lg shadow-2xl border-2 border-parchment-800 mb-8 relative">
          <div className="absolute -top-4 -left-4 w-8 h-8 border-t-4 border-l-4 border-crimson"></div>
          <div className="absolute -bottom-4 -right-4 w-8 h-8 border-b-4 border-r-4 border-crimson"></div>
          
          <p className="mb-4 text-lg font-serif">
            贫僧有礼了。西天取经之路，妖魔横行，劫难重重。
          </p>
          <p className="mb-6 text-lg font-serif">
            光靠金箍棒未必能降妖除魔。你需熟读原著，针对每一难，选用<strong>正确的法宝</strong>方能化险为夷。
          </p>
          <button 
            onClick={startGame}
            className="px-10 py-4 bg-crimson text-parchment-100 font-bold text-2xl rounded shadow-lg hover:bg-red-900 transition-colors tracking-widest"
          >
            踏上征途
          </button>
        </div>
        <p className="text-sm opacity-50 font-serif">请开启声音以获得最佳体验</p>
      </div>
    );
  }

  if (gameState.status === 'loading_level') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-6xl animate-spin mb-8 grayscale opacity-50">☯️</div>
        <h2 className="text-3xl font-serif text-parchment-900 animate-pulse tracking-widest">{loadingMsg}</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-5xl mx-auto flex flex-col relative">
      {/* Audio Control Floating Button */}
      <button 
        onClick={handleStopAudio}
        className="fixed top-4 right-4 z-50 bg-parchment-200 border-2 border-parchment-800 text-parchment-900 p-2 rounded-full shadow-lg hover:bg-crimson hover:text-white transition-colors flex items-center gap-2 px-4"
        title="停止朗读"
      >
        <span>🔇</span>
        <span className="font-serif font-bold text-sm">静音/停止</span>
      </button>

      {/* Header */}
      <div className="flex justify-between items-end border-b-2 border-parchment-800 pb-4 mb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-crimson tracking-wide">
            {gameState.level === 81 ? '最后一难' : `第 ${gameState.level} 难`}
          </h1>
          <span className="text-parchment-800 font-serif italic">功德值: {gameState.score}</span>
        </div>
        <div className="text-right">
           <span className="text-xs uppercase tracking-widest text-parchment-800 block">当前地界</span>
           <span className="font-bold text-lg font-serif">
             {gameState.currentLevelData?.chapter ? `第${gameState.currentLevelData.chapter}回` : '未知之地'}
           </span>
        </div>
      </div>

      {/* Main Game Area */}
      {gameState.currentLevelData && (
        <>
          <GameScene 
            enemyName={gameState.currentLevelData.enemyName}
            monsterImageUrl={gameState.currentLevelData.monsterImageUrl}
            playerState={playerAnim}
            enemyState={enemyAnim}
          />

          <div className="bg-parchment-100 p-6 rounded-lg border border-parchment-800 shadow-md mb-8 min-h-[140px] relative">
            <h3 className="text-2xl font-bold mb-3 text-crimson font-serif tracking-wide border-b border-parchment-300 pb-2 inline-block">
              {gameState.currentLevelData.title}
            </h3>
            {gameState.narrativeFeedback ? (
               <Typewriter 
                 key={gameState.narrativeFeedback} // Reset on change
                 text={gameState.narrativeFeedback} 
                 className="text-lg font-serif italic text-parchment-900 leading-loose"
               />
            ) : (
              <p className="text-lg font-serif text-parchment-900 leading-loose text-justify">
                {gameState.currentLevelData.story}
              </p>
            )}
          </div>

          {/* Actions Area */}
          {(gameState.status === 'playing' || gameState.status === 'resolving') && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {gameState.currentLevelData.artifacts.map((artifact, idx) => (
                <ArtifactCard 
                  key={idx}
                  artifact={artifact}
                  onClick={() => handleArtifactChoice(artifact.name)}
                  disabled={gameState.status === 'resolving'}
                />
              ))}
            </div>
          )}

          {/* Success State */}
          {gameState.status === 'success' && (
            <div className="flex flex-col items-center animate-fade-in my-8 p-6 bg-parchment-200 border-2 border-gold rounded-lg">
              <h2 className="text-4xl font-bold text-green-800 mb-2 font-serif tracking-widest">善哉善哉！</h2>
              <p className="mb-6 font-serif text-parchment-800">施主好眼力，此难已过。</p>
              <button 
                onClick={nextLevel}
                className="px-10 py-3 bg-gold text-white font-bold text-xl rounded shadow-lg hover:bg-yellow-600 transition-colors tracking-wide"
              >
                继续西行 →
              </button>
            </div>
          )}

          {/* Failure State */}
          {gameState.status === 'game_over' && (
            <div className="flex flex-col items-center animate-fade-in my-8 p-6 bg-parchment-200 border-2 border-crimson rounded-lg">
              <h2 className="text-4xl font-bold text-crimson mb-2 font-serif tracking-widest">胜败乃兵家常事</h2>
              <p className="mb-6 text-parchment-800 font-serif">可惜选错了法宝，已被妖怪拿去...</p>
              <button 
                onClick={resetGame}
                className="px-10 py-3 bg-parchment-800 text-white font-bold text-xl rounded shadow-lg hover:bg-parchment-900 transition-colors tracking-wide"
              >
                重新来过
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default App;