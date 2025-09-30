export interface SemanticScholarPaper {
  paperId: string;
  externalIds?: {
    DOI?: string;
    ArXiv?: string;
    MAG?: string;
    CorpusId?: number;
    PubMed?: string;
    PubMedCentral?: string;
  };
  url: string;
  title: string;
  abstract?: string;
  venue?: string;
  year?: number;
  referenceCount?: number;
  citationCount?: number;
  influentialCitationCount?: number;
  isOpenAccess?: boolean;
  openAccessPdf?: {
    url: string;
    status: string;
  };
  fieldsOfStudy?: string[];
  s2FieldsOfStudy?: Array<{
    category: string;
    source: string;
  }>;
  publicationTypes?: string[];
  publicationDate?: string;
  journal?: {
    name?: string;
    volume?: string;
    pages?: string;
  };
  authors?: Array<{
    authorId: string;
    name: string;
    url?: string;
  }>;
  citations?: Array<{
    paperId: string;
    title: string;
  }>;
  references?: Array<{
    paperId: string;
    title: string;
  }>;
}

export interface SemanticScholarError {
  error: string;
  message?: string;
}