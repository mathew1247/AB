export type Difficulty = "easy" | "medium" | "hard";

export interface Evaluation {
  score: number;
  correctness: number;
  conceptUnderstanding: number;
  communication: number;
  strengths: string[];
  weaknesses: string[];
  missingConcepts: string[];
  feedback: string;
}
