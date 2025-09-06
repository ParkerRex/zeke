import CompanyPanel from '@/components/company/CompanyPanel';
import CompanyHydrator from './hydrate-client';

export default function CompanySlugPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  return (
    <>
      <CompanyHydrator slug={slug} />
      <CompanyPanel />
    </>
  );
}
import type { Metadata } from 'next';
import { getCompanyMetaBySlug } from '@/data/company';

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const meta = getCompanyMetaBySlug(params.slug);
  const title = meta ? `${meta.name} • Company • ZEKE` : `Company • ZEKE`;
  const description = meta
    ? `Latest news and CEO updates for ${meta.name}.`
    : 'Explore company news and CEO updates.';
  return { title, description };
}
