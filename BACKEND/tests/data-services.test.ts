import { describe, expect, it } from "vitest";
import { candidateService } from "../src/services/candidate.service";
import { curriculumService } from "../src/services/curriculum.service";

describe("candidate service", () => {
  it("loads candidates from data file", () => {
    const list = candidateService.list();
    expect(list.length).toBeGreaterThan(0);
    expect(candidateService.findById("cand-1")).not.toBeNull();
    expect(candidateService.findById("does-not-exist")).toBeNull();
  });
});

describe("curriculum service", () => {
  it("loads curriculum from data file", () => {
    const list = curriculumService.list();
    expect(list.length).toBeGreaterThan(0);
    expect(curriculumService.findById("java-core")).not.toBeNull();
    expect(curriculumService.findById("does-not-exist")).toBeNull();
  });

  it("returns first uncovered topic, then the weakest once all are covered", () => {
    const curriculum = curriculumService.findById("java-core")!;
    const session = {
      coveredTopics: [] as string[],
      topicScores: {} as Record<string, number[]>,
      conceptsAsked: [] as string[],
    };

    const first = curriculumService.getNextTopic(curriculum, session);
    expect(first.topicName).toBe("OOP");

    session.coveredTopics = curriculum.topics.map((t) => t.name);
    session.topicScores = { OOP: [90], Collections: [90], "Exception Handling": [90], Multithreading: [40] };
    const weakest = curriculumService.getNextTopic(curriculum, session);
    expect(weakest.topicName).toBe("Multithreading");
  });
});
