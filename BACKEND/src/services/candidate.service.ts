import type { Candidate } from "../models/candidate.types";
import { loadJson } from "../utils/load-data";

export class CandidateService {
  private readonly candidates: Candidate[] = loadJson<Candidate[]>("candidates.json");

  findById(id: string): Candidate | null {
    return this.candidates.find((c) => c.id === id) ?? null;
  }

  list(): Candidate[] {
    return this.candidates;
  }
}

export const candidateService = new CandidateService();
