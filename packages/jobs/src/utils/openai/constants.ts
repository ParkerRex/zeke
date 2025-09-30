export const DEFAULT_CHAT_MODEL =
  process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini";
export const DEFAULT_EMBEDDING_MODEL =
  process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";

export const MODEL_VERSION_LABELS = {
  chat: `${DEFAULT_CHAT_MODEL}-v1`,
  embedding: `${DEFAULT_EMBEDDING_MODEL}-v1`,
};

export const MAX_CONTENT_LENGTH_ANALYSIS = 8_000;
export const MAX_CONTENT_LENGTH_EMBEDDING = 6_000;

export const EMBEDDING_DIMENSIONS = 1_536;

export const CHILI_MIN = 0;
export const CHILI_MAX = 5;
export const CHILI_DEFAULT = 1;
export const CHILI_KEYWORD_BOOST = 1;

export const CONFIDENCE_MIN = 0;
export const CONFIDENCE_MAX = 1;
export const CONFIDENCE_DEFAULT = 0.5;

export const CONFIDENCE_RELIABLE_SOURCE_BOOST = 0.3;
export const CONFIDENCE_LONG_TEXT_BOOST = 0.1;
export const CONFIDENCE_TITLE_BOOST = 0.1;

export const TEXT_LENGTH_THRESHOLD = 2_000;
export const TITLE_MIN_LENGTH = 10;
export const TEXT_MIN_LENGTH = 1_000;

export const EMBEDDING_NORMALIZATION_FACTOR = 0.1;
export const CHAR_NORMALIZATION = 255.0;
