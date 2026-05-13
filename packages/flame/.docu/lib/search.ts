/**
 * Client-side fuzzy search engine
 *
 * Features:
 * - Levenshtein distance for typo tolerance
 * - Weighted scoring per hierarchy level (lvl0=8, lvl1=7, ..., content=1)
 * - Tokenized query matching
 * - Deduplication by URL
 */

import type { SearchRecord } from "./search-indexer";

export interface SearchResult {
  url: string;
  title: string;
  hierarchy: SearchRecord["hierarchy"];
  content: string | null;
  score: number;
  type: SearchRecord["type"];
}

const WEIGHTS: Record<string, number> = {
  lvl0: 8,
  lvl1: 7,
  lvl2: 6,
  lvl3: 5,
  lvl4: 4,
  lvl5: 3,
  lvl6: 2,
  content: 1,
};

function levenshtein(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = b[i - 1] === a[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[b.length][a.length];
}

function fuzzyMatch(query: string, text: string): number {
  const q = query.toLowerCase();
  const t = text.toLowerCase();

  if (t.includes(q)) return 1;

  const words = t.split(/\s+/);
  let bestScore = 0;

  for (const word of words) {
    if (word.startsWith(q)) {
      bestScore = Math.max(bestScore, 0.9);
      continue;
    }
    if (word.includes(q)) {
      bestScore = Math.max(bestScore, 0.7);
      continue;
    }

    const maxDist = q.length <= 3 ? 1 : q.length <= 6 ? 2 : 3;
    const dist = levenshtein(q, word.slice(0, q.length + maxDist));
    if (dist <= maxDist) {
      const score = 1 - dist / Math.max(q.length, word.length);
      bestScore = Math.max(bestScore, score * 0.6);
    }
  }

  return bestScore;
}

function scoreRecord(tokens: string[], record: SearchRecord): number {
  let totalScore = 0;

  for (const token of tokens) {
    let tokenBest = 0;

    for (const [key, weight] of Object.entries(WEIGHTS)) {
      const text =
        key === "content" ? record.content : record.hierarchy[key as keyof typeof record.hierarchy];
      if (!text) continue;

      const match = fuzzyMatch(token, text);
      if (match > 0) {
        tokenBest = Math.max(tokenBest, match * weight);
      }
    }
    totalScore += tokenBest;
  }

  return totalScore;
}

export function search(query: string, index: SearchRecord[], limit = 12): SearchResult[] {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const tokens = trimmed.toLowerCase().split(/\s+/).filter(Boolean);
  const scored: SearchResult[] = [];

  for (const record of index) {
    const score = scoreRecord(tokens, record);
    if (score > 0) {
      const title =
        record.hierarchy.lvl6 ||
        record.hierarchy.lvl5 ||
        record.hierarchy.lvl4 ||
        record.hierarchy.lvl3 ||
        record.hierarchy.lvl2 ||
        record.hierarchy.lvl1 ||
        record.hierarchy.lvl0;

      scored.push({
        url: record.url,
        title,
        hierarchy: record.hierarchy,
        content: record.content,
        score,
        type: record.type,
      });
    }
  }

  scored.sort((a, b) => b.score - a.score);

  const seen = new Set<string>();
  const results: SearchResult[] = [];
  for (const item of scored) {
    if (seen.has(item.url)) continue;
    seen.add(item.url);
    results.push(item);
    if (results.length >= limit) break;
  }

  return results;
}
