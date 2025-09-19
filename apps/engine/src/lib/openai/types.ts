export type AnalysisInput = {
  title: string | null;
  canonical_url: string | null;
  text: string;
};

export type AnalysisResult = {
  why_it_matters: string;
  chili: number;
  confidence: number;
  citations: Record<string, unknown>;
};

export type EmbeddingInput = {
  title: string | null;
  text: string;
};

export type EmbeddingResult = {
  embedding: number[];
};
