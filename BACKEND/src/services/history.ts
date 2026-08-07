import type { Evaluation } from "../models/evaluation.types";
import type { InterviewSession } from "../models/interview.types";
import type { PreviousTurn } from "../ai/ai.provider";

export function getEvaluations(session: InterviewSession): Evaluation[] {
  const out: Evaluation[] = [];
  for (const turn of session.history) {
    if (turn.role === "evaluation") {
      out.push(turn.evaluation);
    }
  }
  return out;
}

export function getAnswers(session: InterviewSession): string[] {
  const out: string[] = [];
  for (const turn of session.history) {
    if (turn.role === "candidate") {
      out.push(turn.answer);
    }
  }
  return out;
}

export function getPreviousTurn(session: InterviewSession): PreviousTurn | null {
  for (let i = session.history.length - 1; i >= 0; i--) {
    const turn = session.history[i];
    if (turn.role === "evaluation") {
      const question = session.history[i - 2];
      const answer = session.history[i - 1];
      if (question?.role === "interviewer" && answer?.role === "candidate") {
        return {
          question: question.question,
          answer: answer.answer,
          evaluation: turn.evaluation,
        };
      }
    }
  }
  return null;
}

export function lastEvaluation(session: InterviewSession): Evaluation | null {
  const evals = getEvaluations(session);
  return evals.length > 0 ? evals[evals.length - 1] : null;
}
