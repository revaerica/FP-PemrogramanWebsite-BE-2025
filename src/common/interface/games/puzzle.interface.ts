export interface IPuzzleJson {
  puzzle_image: string;
  difficulty: 'easy' | 'medium' | 'hard';
  grid_size: number;
  time_limit?: number;
  max_moves?: number;
}

export interface IPuzzlePiece {
  id: number;
  current_position: number;
  correct_position: number;
}

export interface IPuzzleCheckResult {
  is_complete: boolean;
  moves_count: number;
  time_taken?: number;
  score: number;
}
