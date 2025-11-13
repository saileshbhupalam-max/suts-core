/**
 * RGS Analysis - Similarity Calculator
 *
 * Computes text similarity using multiple algorithms:
 * - Cosine similarity (TF-IDF vectors)
 * - Jaccard similarity (word sets)
 * - Levenshtein distance (normalized)
 */

import { TfIdf } from 'natural';

/**
 * Vector representation of text
 */
interface Vector {
  [term: string]: number;
}

/**
 * Calculates similarity between text documents using multiple algorithms
 */
export class SimilarityCalculator {
  /**
   * Compute cosine similarity between two texts using TF-IDF vectors
   *
   * @param text1 - First text to compare
   * @param text2 - Second text to compare
   * @returns Similarity score between 0 and 1
   */
  cosineSimilarity(text1: string, text2: string): number {
    // Create fresh TF-IDF instance for calculation
    const tfidf = new TfIdf();
    tfidf.addDocument(text1);
    tfidf.addDocument(text2);

    const vector1 = this.vectorize(tfidf, 0);
    const vector2 = this.vectorize(tfidf, 1);

    return this.cosine(vector1, vector2);
  }

  /**
   * Compute Levenshtein similarity (normalized)
   *
   * @param text1 - First text to compare
   * @param text2 - Second text to compare
   * @returns Similarity score between 0 and 1
   */
  levenshteinSimilarity(text1: string, text2: string): number {
    const distance = this.levenshtein(text1, text2);
    const maxLen = Math.max(text1.length, text2.length);

    if (maxLen === 0) {
      return 1.0; // Both strings are empty
    }

    return 1 - distance / maxLen;
  }

  /**
   * Compute Jaccard similarity on word sets
   *
   * @param text1 - First text to compare
   * @param text2 - Second text to compare
   * @returns Similarity score between 0 and 1
   */
  jaccardSimilarity(text1: string, text2: string): number {
    const words1 = new Set(this.tokenize(text1));
    const words2 = new Set(this.tokenize(text2));

    if (words1.size === 0 && words2.size === 0) {
      return 1.0; // Both sets are empty
    }

    const intersection = new Set([...words1].filter((w) => words2.has(w)));
    const union = new Set([...words1, ...words2]);

    if (union.size === 0) {
      return 0;
    }

    return intersection.size / union.size;
  }

  /**
   * Compute combined similarity (weighted average of multiple metrics)
   *
   * @param text1 - First text to compare
   * @param text2 - Second text to compare
   * @returns Similarity score between 0 and 1
   */
  similarity(text1: string, text2: string): number {
    const cosine = this.cosineSimilarity(text1, text2);
    const jaccard = this.jaccardSimilarity(text1, text2);

    // Weight cosine more heavily (70%) than Jaccard (30%)
    return 0.7 * cosine + 0.3 * jaccard;
  }

  /**
   * Vectorize a document from the TF-IDF corpus
   *
   * @param tfidf - TF-IDF instance
   * @param docIndex - Index of the document in the TF-IDF corpus
   * @returns Vector representation of the document
   */
  private vectorize(tfidf: TfIdf, docIndex: number): Vector {
    const vector: Vector = {};
    const terms = tfidf.listTerms(docIndex);

    for (const term of terms) {
      vector[term.term] = term.tfidf;
    }

    return vector;
  }

  /**
   * Compute cosine similarity between two vectors
   *
   * @param v1 - First vector
   * @param v2 - Second vector
   * @returns Cosine similarity between 0 and 1
   */
  private cosine(v1: Vector, v2: Vector): number {
    const terms = new Set([...Object.keys(v1), ...Object.keys(v2)]);

    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;

    for (const term of terms) {
      const value1 = v1[term] ?? 0;
      const value2 = v2[term] ?? 0;

      dotProduct += value1 * value2;
      magnitude1 += value1 * value1;
      magnitude2 += value2 * value2;
    }

    const denominator = Math.sqrt(magnitude1) * Math.sqrt(magnitude2);

    if (denominator === 0) {
      return 0;
    }

    return dotProduct / denominator;
  }

  /**
   * Compute Levenshtein distance between two strings
   *
   * @param str1 - First string
   * @param str2 - Second string
   * @returns Edit distance
   */
  private levenshtein(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;

    // Create a 2D array for dynamic programming
    const matrix: number[][] = Array(len1 + 1)
      .fill(null)
      .map(() => Array(len2 + 1).fill(0));

    // Initialize first column and row
    for (let i = 0; i <= len1; i++) {
      matrix[i]![0] = i;
    }

    for (let j = 0; j <= len2; j++) {
      matrix[0]![j] = j;
    }

    // Fill in the rest of the matrix
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;

        matrix[i]![j] = Math.min(
          matrix[i - 1]![j]! + 1, // Deletion
          matrix[i]![j - 1]! + 1, // Insertion
          matrix[i - 1]![j - 1]! + cost // Substitution
        );
      }
    }

    return matrix[len1]![len2]!;
  }

  /**
   * Tokenize text into lowercase words
   *
   * @param text - Text to tokenize
   * @returns Array of lowercase word tokens
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 0);
  }
}
