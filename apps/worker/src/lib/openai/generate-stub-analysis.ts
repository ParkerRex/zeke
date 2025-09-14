import {
  CHILI_DEFAULT,
  CHILI_KEYWORD_BOOST,
  CHILI_MAX,
  CHILI_MIN,
  CONFIDENCE_DEFAULT,
  CONFIDENCE_LONG_TEXT_BOOST,
  CONFIDENCE_MAX,
  CONFIDENCE_RELIABLE_SOURCE_BOOST,
  CONFIDENCE_TITLE_BOOST,
  TEXT_LENGTH_THRESHOLD,
  TEXT_MIN_LENGTH,
  TITLE_MIN_LENGTH,
} from './constants.js';
import type { AnalysisInput, AnalysisResult } from './types.js';

const WORD_SPLIT_PATTERN = /\s+/;

export function generateStubAnalysis(
  story: AnalysisInput
): Promise<AnalysisResult> {
  const textLength = story.text.length;
  const titleWords = (story.title || '')
    .toLowerCase()
    .split(WORD_SPLIT_PATTERN);

  const hasImportantKeywords = titleWords.some((word) =>
    [
      'ai',
      'artificial',
      'intelligence',
      'breakthrough',
      'security',
      'privacy',
      'data',
    ].includes(word)
  );

  const domain = story.canonical_url
    ? new URL(story.canonical_url).hostname
    : 'unknown';
  const isReliableSource = ['arstechnica.com', 'news.ycombinator.com'].includes(
    domain
  );

  let why_it_matters = '';
  if (hasImportantKeywords) {
    why_it_matters =
      '• This story covers emerging technology trends that could impact how we work and live\n' +
      '• The developments discussed may influence industry standards and practices\n' +
      '• Understanding these changes helps stay informed about technological progress';
  } else {
    why_it_matters =
      '• This story provides insights into current industry developments\n' +
      '• The information may be relevant for understanding market trends\n' +
      '• Staying informed about these topics helps with professional awareness';
  }

  let chili = CHILI_DEFAULT;
  if (hasImportantKeywords) {
    chili += CHILI_KEYWORD_BOOST;
  }
  if (textLength > TEXT_LENGTH_THRESHOLD) {
    chili += 1;
  }
  if (isReliableSource) {
    chili += 1;
  }
  chili = Math.min(Math.max(chili, CHILI_MIN), CHILI_MAX);

  let confidence = CONFIDENCE_DEFAULT;
  if (isReliableSource) {
    confidence += CONFIDENCE_RELIABLE_SOURCE_BOOST;
  }
  if (textLength > TEXT_MIN_LENGTH) {
    confidence += CONFIDENCE_LONG_TEXT_BOOST;
  }
  if (story.title && story.title.length > TITLE_MIN_LENGTH) {
    confidence += CONFIDENCE_TITLE_BOOST;
  }
  confidence = Math.min(confidence, CONFIDENCE_MAX);

  return Promise.resolve({ why_it_matters, chili, confidence, citations: {} });
}
