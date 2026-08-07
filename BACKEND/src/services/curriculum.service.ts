import type { Curriculum } from "../models/curriculum.types";
import type { InterviewSession } from "../models/interview.types";
import { loadJson } from "../utils/load-data";

export class CurriculumService {
  private readonly curricula: Curriculum[] = loadJson<Curriculum[]>("curriculum.json");

  findById(id: string): Curriculum | null {
    return this.curricula.find((c) => c.id === id) ?? null;
  }

  list(): Curriculum[] {
    return this.curricula;
  }

  /**
   * Deterministically selects the next topic + concept hint.
   * - Prefers topics not yet covered.
   * - Once all topics are covered, prefers the weakest topic.
   * - Within a topic, prefers concepts not yet asked.
   */
  getNextTopic(
    curriculum: Curriculum,
    session: Pick<InterviewSession, "coveredTopics" | "topicScores" | "conceptsAsked">,
  ): { topicName: string; conceptId: string | null } {
    const uncovered = curriculum.topics.filter((t) => !session.coveredTopics.includes(t.name));
    const topic = uncovered.length > 0 ? uncovered[0] : this.weakestTopic(curriculum, session);

    const next = topic.concepts.find((c) => !session.conceptsAsked.includes(c.id)) ?? topic.concepts[0];
    return { topicName: topic.name, conceptId: next?.id ?? null };
  }

  private weakestTopic(
    curriculum: Curriculum,
    session: Pick<InterviewSession, "topicScores">,
  ): Curriculum["topics"][number] {
    const avg = (topicName: string): number => {
      const scores = session.topicScores[topicName];
      return scores && scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : Infinity;
    };
    return [...curriculum.topics].sort((a, b) => avg(a.name) - avg(b.name))[0];
  }
}

export const curriculumService = new CurriculumService();
