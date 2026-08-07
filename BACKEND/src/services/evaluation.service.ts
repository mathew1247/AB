import type { Difficulty } from "../models/evaluation.types";

const LEVELS: Difficulty[] = ["easy", "medium", "hard"];

/**
 * Deterministic difficulty adaptation.
 *
 * score >= 85 -> increase difficulty
 * score 60-84 -> maintain difficulty
 * score  < 60 -> decrease difficulty (or ask a clarification question)
 */
export function determineDifficulty(previousScore: number, currentDifficulty: Difficulty): Difficulty {
  const idx = LEVELS.indexOf(currentDifficulty);

  if (previousScore >= 85) {
    return LEVELS[Math.min(idx + 1, LEVELS.length - 1)];
  }
  if (previousScore >= 60) {
    return currentDifficulty;
  }
  return LEVELS[Math.max(idx - 1, 0)];
}
