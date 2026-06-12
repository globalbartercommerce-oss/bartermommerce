/**
 * AI Matching Engine - Cosine Similarity Vector Calculation
 * 
 * ใช้สำหรับเปรียบเทียบความต้องการในการแลกเปลี่ยน (Embedding Vectors ขนาด 1,536 มิติ)
 * เพื่อค้นหาข้อเสนอที่มีอัตราความเหมือน/ความเหมาะสมสูงที่สุด
 */

// คำนวณ Dot Product ของ Vector สองชุด
export function dotProduct(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error("เวกเตอร์มีขนาดมิติไม่เท่ากัน");
  }
  let product = 0;
  for (let i = 0; i < vecA.length; i++) {
    product += vecA[i] * vecB[i];
  }
  return product;
}

// คำนวณค่าขนาดความยาวเวกเตอร์ (Magnitude / L2 Norm)
export function magnitude(vec: number[]): number {
  let sum = 0;
  for (let i = 0; i < vec.length; i++) {
    sum += vec[i] * vec[i];
  }
  return Math.sqrt(sum);
}

// คำนวณหาค่าความคล้ายคลึง Cosine Similarity ระหว่างเวกเตอร์ A และ B
// ผลลัพธ์อยู่ในช่วง -1.0 ถึง 1.0 (โดย 1.0 คือทิศทางเหมือนกันเป๊ะ)
export function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
  const magA = magnitude(vecA);
  const magB = magnitude(vecB);
  
  if (magA === 0 || magB === 0) {
    return 0; // ป้องกันการหารด้วย 0
  }
  
  return dotProduct(vecA, vecB) / (magA * magB);
}

interface CandidateListing {
  id: string;
  title: string;
  embedding: number[];
}

interface MatchResult {
  candidateId: string;
  title: string;
  score: number;
}

// ค้นหาดีลจับคู่ที่มีความคล้ายสูงสุด N อันดับแรก
export function findBestBarterMatches(
  targetEmbedding: number[],
  candidates: CandidateListing[],
  limit: number = 5
): MatchResult[] {
  const results = candidates.map((candidate) => {
    const score = calculateCosineSimilarity(targetEmbedding, candidate.embedding);
    return {
      candidateId: candidate.id,
      title: candidate.title,
      score: Math.round(score * 10000) / 10000, // ปัดเศษทศนิยม 4 ตำแหน่ง
    };
  });

  // เรียงลำดับจากคะแนนสูงสุดลงมาต่ำสุด
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
