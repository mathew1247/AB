import type { InterviewSession } from "../models/interview.types";

export interface InterviewRepository {
  save(session: InterviewSession): Promise<void>;
  findById(id: string): Promise<InterviewSession | null>;
}

/**
 * Development/default repository. Used when MONGODB_URI is not set
 * (tests, local demos). Interviews are lost on restart.
 */
export class InMemoryInterviewRepository implements InterviewRepository {
  private readonly store = new Map<string, InterviewSession>();

  async save(session: InterviewSession): Promise<void> {
    this.store.set(session.id, structuredClone(session));
  }

  async findById(id: string): Promise<InterviewSession | null> {
    const session = this.store.get(id);
    return session ? structuredClone(session) : null;
  }
}
