import { describe, test, expect } from "vitest";
import { dotProduct, magnitude, calculateCosineSimilarity, findBestBarterMatches } from "./ai-matching";

describe("AI Matching Engine - Cosine Similarity Tests", () => {
  test("dotProduct should calculate correct scalar product", () => {
    const vecA = [1, 2, 3];
    const vecB = [4, 5, 6];
    // 1*4 + 2*5 + 3*6 = 4 + 10 + 18 = 32
    expect(dotProduct(vecA, vecB)).toBe(32);
  });

  test("dotProduct should throw error for mismatched dimensions", () => {
    const vecA = [1, 2];
    const vecB = [1, 2, 3];
    expect(() => dotProduct(vecA, vecB)).toThrow();
  });

  test("magnitude should calculate correct L2 norm length", () => {
    const vec = [3, 4];
    // sqrt(3^2 + 4^2) = sqrt(25) = 5
    expect(magnitude(vec)).toBe(5);
  });

  test("calculateCosineSimilarity should identify identical directions", () => {
    const vecA = [1, 2, 3];
    const vecB = [2, 4, 6]; // Scalar multiple
    const similarity = calculateCosineSimilarity(vecA, vecB);
    expect(similarity).toBeCloseTo(1.0, 5);
  });

  test("calculateCosineSimilarity should identify orthogonal directions", () => {
    const vecA = [1, 0];
    const vecB = [0, 1]; // Right angle (90 deg)
    const similarity = calculateCosineSimilarity(vecA, vecB);
    expect(similarity).toBe(0);
  });

  test("findBestBarterMatches should correctly score and rank candidate listings", () => {
    const target = [1, 1, 0];
    const candidates = [
      { id: "cand-1", title: "Low Match", embedding: [0, 0, 1] },       // Orthogonal (Similarity: 0)
      { id: "cand-2", title: "Perfect Match", embedding: [2, 2, 0] },   // Same direction (Similarity: 1.0)
      { id: "cand-3", title: "Medium Match", embedding: [1, 0, 0] },    // Semi-same (Similarity: 1/sqrt(2) = ~0.7071)
    ];

    const matches = findBestBarterMatches(target, candidates, 2);

    expect(matches).toHaveLength(2);
    expect(matches[0].candidateId).toBe("cand-2");
    expect(matches[0].score).toBe(1.0);
    expect(matches[1].candidateId).toBe("cand-3");
    expect(matches[1].score).toBeCloseTo(0.7071, 4);
  });
});
