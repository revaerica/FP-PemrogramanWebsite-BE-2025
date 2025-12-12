/**
 * Game JSON structure stored in database
 */
export interface IWatchAndMemorizeGameJson {
  difficulty: 'easy' | 'normal' | 'hard';
  animalsToWatch: number; // 3-5 animals
  memorizationTime: number; // milliseconds (5000-15000)
  guessTimeLimit: number; // seconds (20-40)
  totalRounds: number; // 3-5 rounds
  animalSequence: string[]; // ["penguin", "cat", "dog", ...]
}

/**
 * Response for play mode (GET /api/game/watch-and-memorize/:id/play)
 */
export interface IWatchAndMemorizePlayResponse {
  id: string;
  name: string;
  thumbnail_image: string;
  difficulty: string;
  animalsToWatch: number;
  memorizationTime: number;
  guessTimeLimit: number;
  totalRounds: number;
  animalSequence: string[]; // Frontend akan shuffle ini
}
