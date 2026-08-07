import { describe, expect, it } from "vitest";
import { determineDifficulty } from "../src/services/evaluation.service";

describe("determineDifficulty", () => {
  it("increases difficulty when score >= 85", () => {
    expect(determineDifficulty(90, "easy")).toBe("medium");
    expect(determineDifficulty(85, "medium")).toBe("hard");
    expect(determineDifficulty(95, "hard")).toBe("hard");
  });

  it("maintains difficulty when score is 60-84", () => {
    expect(determineDifficulty(70, "easy")).toBe("easy");
    expect(determineDifficulty(60, "medium")).toBe("medium");
    expect(determineDifficulty(84, "hard")).toBe("hard");
  });

  it("decreases difficulty when score < 60", () => {
    expect(determineDifficulty(40, "hard")).toBe("medium");
    expect(determineDifficulty(20, "medium")).toBe("easy");
    expect(determineDifficulty(55, "easy")).toBe("easy");
  });
});
