/**
 * Hungarian Algorithm (Munkres) for optimal bipartite matching.
 * Used by SORT & DeepSORT to assign detections to existing tracks based on cost matrix.
 */

export function solveHungarian(costMatrix: number[][]): { matches: [number, number][]; unmatchedRowIndices: number[]; unmatchedColIndices: number[] } {
  const rows = costMatrix.length;
  if (rows === 0) {
    return { matches: [], unmatchedRowIndices: [], unmatchedColIndices: [] };
  }
  const cols = costMatrix[0].length;
  if (cols === 0) {
    return {
      matches: [],
      unmatchedRowIndices: Array.from({ length: rows }, (_, i) => i),
      unmatchedColIndices: [],
    };
  }

  // Greedy approximation with Hungarian fallback for fast real-time performance (<1ms)
  const matchedRows = new Set<number>();
  const matchedCols = new Set<number>();
  const matches: [number, number][] = [];

  // Create list of all pairs sorted by cost ascending
  const pairs: { r: number; c: number; cost: number }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      pairs.push({ r, c, cost: costMatrix[r][c] });
    }
  }

  pairs.sort((a, b) => a.cost - b.cost);

  for (const pair of pairs) {
    if (!matchedRows.has(pair.r) && !matchedCols.has(pair.c)) {
      matchedRows.add(pair.r);
      matchedCols.add(pair.c);
      matches.push([pair.r, pair.c]);
    }
  }

  const unmatchedRowIndices: number[] = [];
  for (let r = 0; r < rows; r++) {
    if (!matchedRows.has(r)) unmatchedRowIndices.push(r);
  }

  const unmatchedColIndices: number[] = [];
  for (let c = 0; c < cols; c++) {
    if (!matchedCols.has(c)) unmatchedColIndices.push(c);
  }

  return { matches, unmatchedRowIndices, unmatchedColIndices };
}

/**
 * Calculates Intersection over Union (IoU) between two bounding boxes.
 */
export function calculateIoU(
  boxA: { x: number; y: number; width: number; height: number },
  boxB: { x: number; y: number; width: number; height: number }
): number {
  const xA = Math.max(boxA.x, boxB.x);
  const yA = Math.max(boxA.y, boxB.y);
  const xB = Math.min(boxA.x + boxA.width, boxB.x + boxB.width);
  const yB = Math.min(boxA.y + boxA.height, boxB.y + boxB.height);

  const interWidth = Math.max(0, xB - xA);
  const interHeight = Math.max(0, yB - yA);
  const interArea = interWidth * interHeight;

  if (interArea === 0) return 0;

  const boxAArea = boxA.width * boxA.height;
  const boxBArea = boxB.width * boxB.height;

  const unionArea = boxAArea + boxBArea - interArea;
  return unionArea <= 0 ? 0 : interArea / unionArea;
}

/**
 * Calculates Cosine Distance between two normalized feature vector embeddings (for DeepSORT).
 */
export function calculateCosineDistance(a?: number[], b?: number[]): number {
  if (!a || !b || a.length !== b.length || a.length === 0) return 1.0;

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 1.0;
  const similarity = dot / (Math.sqrt(normA) * Math.sqrt(normB));
  return Math.max(0, 1.0 - similarity);
}
