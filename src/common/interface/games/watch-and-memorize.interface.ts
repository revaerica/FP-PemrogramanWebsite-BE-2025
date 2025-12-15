export interface IWatchAndMemorizeGameJson {
  difficulty: 'easy' | 'normal' | 'hard';
  animalsToWatch: number;
  memorizationTime: number;
  guessTimeLimit: number;
  totalRounds: number;
  animalSequence: string[];

  coinsReward?: {
    easy: number;
    normal: number;
    hard: number;
  };
  pendantsAvailable?: boolean;
}

export interface IWatchAndMemorizePlayResponse {
  id: string;
  name: string;
  thumbnail_image: string;
  difficulty: 'easy' | 'normal' | 'hard';
  animalsToWatch: number;
  memorizationTime: number;
  guessTimeLimit: number;
  totalRounds: number;
  animalSequence: string[];
  coinsReward?: number;
  pendantsEnabled?: boolean;
}
