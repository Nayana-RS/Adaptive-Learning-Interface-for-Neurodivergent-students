import { SimplifiedContent } from "../types";

/**
 * A fast, rule-based text simplifier that runs in ~10ms client-side.
 * Used for instant feedback as requested.
 */
export function localSimplify(text: string): SimplifiedContent {
  // 1. Split into sentences more robustly
  const sentences = text.split(/(?<=[.!?])\s+/);
  
  // 2. Create chunks (preserving ALL original text)
  // We group sentences into chunks of ~40-60 words for ADHD focus
  const chunks: string[] = [];
  let currentChunk: string[] = [];
  let currentWordCount = 0;

  sentences.forEach(sentence => {
    const words = sentence.split(/\s+/).length;
    if (currentWordCount + words > 60 && currentChunk.length > 0) {
      chunks.push(currentChunk.join(' '));
      currentChunk = [sentence];
      currentWordCount = words;
    } else {
      currentChunk.push(sentence);
      currentWordCount += words;
    }
  });
  
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(' '));
  }

  // 3. Extract keywords
  const words = text.split(/\s+/);
  const keywordMap = new Map<string, number>();
  const stopWords = new Set(['the', 'and', 'that', 'this', 'with', 'from', 'which']);
  
  words.forEach(word => {
    const clean = word.toLowerCase().replace(/[^a-z]/g, '');
    if (clean.length > 7 && !stopWords.has(clean)) {
      keywordMap.set(clean, (keywordMap.get(clean) || 0) + 1);
    }
  });

  const keywords = Array.from(keywordMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(entry => entry[0]);

  // 4. Generate summary (first 15% of sentences, max 3)
  const summaryCount = Math.min(3, Math.max(1, Math.floor(sentences.length * 0.15)));
  const summary = sentences.slice(0, summaryCount).join(' ').trim();

  // 5. Bullet points (main idea of each chunk)
  const bulletPoints = chunks.map(chunk => {
    const firstSentence = chunk.split(/[.!?]/)[0];
    return firstSentence.length > 10 ? firstSentence + '.' : chunk;
  }).slice(0, 12);

  return {
    summary,
    chunks,
    keywords,
    bulletPoints
  };
}
