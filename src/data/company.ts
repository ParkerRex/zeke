export type CompanyMeta = {
  name: string;
  slug: string;
  ceo: string;
  domain: string;
};

export const COMPANIES: CompanyMeta[] = [
  { name: "OpenAI", slug: "openai", ceo: "Sam Altman", domain: "openai.com" },
  {
    name: "Anthropic",
    slug: "anthropic",
    ceo: "Dario Amodei",
    domain: "anthropic.com",
  },
  {
    name: "Google DeepMind",
    slug: "deepmind",
    ceo: "Demis Hassabis",
    domain: "deepmind.com",
  },
  { name: "Meta AI", slug: "meta", ceo: "Mark Zuckerberg", domain: "meta.com" },
  {
    name: "Mistral AI",
    slug: "mistral",
    ceo: "Arthur Mensch",
    domain: "mistral.ai",
  },
  { name: "Cohere", slug: "cohere", ceo: "Aidan Gomez", domain: "cohere.com" },
  {
    name: "Perplexity",
    slug: "perplexity",
    ceo: "Aravind Srinivas",
    domain: "perplexity.ai",
  },
  {
    name: "Stability AI",
    slug: "stability",
    ceo: "Emad Mostaque",
    domain: "stability.ai",
  },
  { name: "xAI", slug: "xai", ceo: "Elon Musk", domain: "x.ai" },
  {
    name: "OpenRouter",
    slug: "openrouter",
    ceo: "Emil",
    domain: "openrouter.ai",
  },
];

export function getCompanyMetaBySlug(slug: string): CompanyMeta | undefined {
  return COMPANIES.find((c) => c.slug === slug);
}
