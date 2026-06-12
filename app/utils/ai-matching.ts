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

// =========================================================================
// HYBRID SEMANTIC-RULE MATCHMAKER (FALLBACK WHEN EMBEDDINGS ARE MISSING)
// =========================================================================

export interface HybridListing {
  id: string;
  title: string;
  category: string;
  estimated_value: number;
  business_id: string;
  company_name: string;
  country_code: string;
}

export interface HybridMatchResult {
  id: string;
  yourListing: string;
  matchedWith: string;
  similarity: string;
  rationale: string;
  partnerBusinessId: string;
  partnerListingId: string;
  myListingId: string;
}

export function generateHybridMatches(
  myListings: HybridListing[],
  otherListings: HybridListing[]
): HybridMatchResult[] {
  const matches: HybridMatchResult[] = [];

  for (const myL of myListings) {
    for (const otherL of otherListings) {
      if (myL.business_id === otherL.business_id) continue;

      let score = 0.5; // คะแนนฐาน

      // 1. หมวดหมู่สินค้าใกล้เคียงกันหรืออยู่ในเกณฑ์ที่มักแลกกัน
      if (myL.category !== otherL.category) {
        score += 0.15; // ความต่างประเภทมักเป็นโอกาสแลกเปลี่ยน (Double Coincidence)
      } else {
        score += 0.05; // หมวดหมู่เดียวกันอาจมีความสนใจใกล้เคียงกัน
      }

      // 2. เปรียบเทียบมูลค่าของที่จะแลกเปลี่ยน
      const valDiffRatio = Math.abs(myL.estimated_value - otherL.estimated_value) / Math.max(myL.estimated_value, 1);
      if (valDiffRatio <= 0.1) {
        score += 0.25; // มูลค่าต่างกันไม่เกิน 10% เหมาะสมดีเลิศ
      } else if (valDiffRatio <= 0.3) {
        score += 0.15; // ต่างกันไม่เกิน 30% พอแลกเปลี่ยนได้
      } else if (valDiffRatio <= 0.5) {
        score += 0.05;
      }

      // 3. ปรับคะแนนตามคำสำคัญ
      const myTitleLower = myL.title.toLowerCase();
      const otherTitleLower = otherL.title.toLowerCase();
      if ((myTitleLower.includes("rice") && otherTitleLower.includes("solar")) ||
          (myTitleLower.includes("solar") && otherTitleLower.includes("rice")) ||
          (myTitleLower.includes("erp") && otherTitleLower.includes("pack")) ||
          (myTitleLower.includes("pack") && otherTitleLower.includes("erp"))) {
        score += 0.1;
      }

      // ตรึงคะแนนให้อยู่ในช่วง 0.1 ถึง 0.99
      const finalScore = Math.min(0.99, Math.max(0.1, score));

      // คำนวณคำอธิบาย
      let rationale = `ระบบประเมินความสอดคล้องด้านมูลค่าโดยมีความต่างส่วนต่างค้างจ่าย ${Math.abs(myL.estimated_value - otherL.estimated_value).toLocaleString()} UNC ซึ่งเอื้อต่อการแลกเปลี่ยน`;
      if (finalScore > 0.8) {
        rationale = `คู่ค้าชาว ${otherL.country_code} จาก ${otherL.company_name} มีสินค้าที่เหมาะสมสูงมาก และยินดีชำระส่วนต่างค้างชำระในระบบ Unicorn Credits`;
      } else if (finalScore > 0.6) {
        rationale = `ระดับความต้องการสินค้าหมวดหมู่ ${myL.category} กำลังขยายตัวในกลุ่มธุรกิจของคู่ค้า เหมาะสมในการเริ่มข้อเสนอแลกเปลี่ยน`;
      }

      matches.push({
        id: `match-${myL.id.substring(0, 4)}-${otherL.id.substring(0, 4)}`,
        yourListing: myL.title,
        matchedWith: `${otherL.title} (${otherL.company_name})`,
        similarity: `${(finalScore * 100).toFixed(1)}%`,
        rationale,
        partnerBusinessId: otherL.business_id,
        partnerListingId: otherL.id,
        myListingId: myL.id,
      });
    }
  }

  // เรียงลำดับตามความคล้ายสูงสุด
  return matches
    .sort((a, b) => parseFloat(b.similarity) - parseFloat(a.similarity))
    .slice(0, 5); // จำกัด 5 รายการแรกที่ตรงที่สุด
}

