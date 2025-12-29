import React from 'react';

interface GameSceneProps {
  enemyName: string;
  monsterImageUrl?: string;
  playerState: 'idle' | 'attack' | 'hit';
  enemyState: 'idle' | 'attack' | 'hit' | 'dead';
}

export const GameScene: React.FC<GameSceneProps> = ({ enemyName, monsterImageUrl, playerState, enemyState }) => {
  
  // Wukong Visuals
  const MonkeyKing = () => (
    <div className={`relative w-32 h-32 md:w-40 md:h-40 transition-transform duration-500 z-10 ${
      playerState === 'attack' ? 'translate-x-20' : ''
    } ${playerState === 'hit' ? 'animate-shake opacity-50' : 'animate-float'}`}>
       {/* Cloud */}
      <div className="absolute bottom-0 left-0 text-6xl opacity-80 filter blur-sm">☁️</div>
      {/* Monkey Emoji as placeholder for Wukong, maybe improve later */}
      <div className="absolute bottom-4 left-4 text-8xl md:text-9xl z-10 drop-shadow-lg transform scale-x-[-1]">🐵</div>
      {/* Staff */}
      <div className={`absolute top-0 right-0 text-7xl md:text-8xl transform origin-bottom-left transition-all duration-300 drop-shadow-md ${
        playerState === 'attack' ? 'rotate-45' : '-rotate-12'
      }`}>🥢</div>
      
      <div className="absolute -bottom-10 left-0 w-full text-center">
        <span className="inline-block bg-parchment-200 text-parchment-900 border-2 border-parchment-800 px-3 py-1 rounded-sm font-serif font-bold text-lg shadow-md">
          孙悟空
        </span>
      </div>
    </div>
  );

  // Realistic Enemy Visuals
  const Enemy = () => (
    <div className={`relative w-40 h-40 md:w-56 md:h-56 transition-all duration-700 ${
      enemyState === 'dead' ? 'opacity-0 scale-50 filter grayscale' : 'opacity-100'
    } ${enemyState === 'hit' ? 'animate-shake brightness-150 sepia' : ''} ${
      enemyState === 'attack' ? '-translate-x-20' : ''
    }`}>
      
      {/* Monster Image Container */}
      <div className="w-full h-full rounded-lg overflow-hidden border-4 border-crimson shadow-2xl bg-black relative">
         {monsterImageUrl ? (
            <img 
              src={monsterImageUrl} 
              alt={enemyName} 
              className="w-full h-full object-cover animate-fade-in"
            />
         ) : (
            // Fallback if image generation fails
            <div className="flex items-center justify-center w-full h-full bg-parchment-900 text-6xl">
              👹
            </div>
         )}
         
         {/* Damage overlay */}
         {enemyState === 'hit' && (
           <div className="absolute inset-0 bg-white opacity-30 mix-blend-overlay"></div>
         )}
      </div>

      <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 w-max max-w-[200px] text-center z-20">
         <span className="inline-block bg-crimson text-parchment-100 border-2 border-parchment-900 px-3 py-1 rounded-sm font-serif font-bold text-lg shadow-md tracking-widest">
          {enemyName}
        </span>
      </div>
    </div>
  );

  return (
    <div className="w-full h-80 bg-parchment-300 border-y-8 border-parchment-800 relative overflow-hidden flex justify-between items-center px-4 md:px-20 my-6 shadow-[inset_0_0_40px_rgba(0,0,0,0.3)]">
      {/* Background Decor */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(#5c4b36 1px, transparent 1px)',
        backgroundSize: '20px 20px'
      }}></div>
      
      {/* Atmospheric Fog */}
      <div className="absolute inset-0 bg-gradient-to-t from-parchment-800/20 to-transparent pointer-events-none"></div>

      <MonkeyKing />
      
      {/* VS Badge */}
      <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-5xl md:text-7xl font-serif text-crimson font-bold opacity-20 select-none z-0">
        VS
      </div>

      <Enemy />
    </div>
  );
};