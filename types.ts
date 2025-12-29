export interface Artifact {
  name: string;
  description: string;
  icon: string; // Emoji or simple char
  isCorrect: boolean;
}

export interface LevelData {
  chapter: number;
  title: string;
  story: string;
  enemyName: string;
  enemyDescription: string;
  monsterImageUrl?: string; // New field for generated image
  artifacts: Artifact[];
  difficulty: 'Hard' | 'Extreme';
}

export interface GameState {
  status: 'intro' | 'loading_level' | 'playing' | 'resolving' | 'success' | 'game_over' | 'victory';
  level: number;
  score: number;
  currentLevelData: LevelData | null;
  narrativeFeedback: string | null;
  history: string[]; // Keep track of defeated enemies
}

export interface ValidationResponse {
  success: boolean;
  narrative: string; // The story of what happened when the item was used
}