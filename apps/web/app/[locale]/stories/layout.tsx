/**
 * Layout for stories section
 */

import { getDictionary } from '@zeke/internationalization';
import { createMetadata } from '@zeke/seo/metadata';
import type { Metadata } from 'next';

type StoriesLayoutProps = {
  children: React.ReactNode;
  params: Promise<{
    locale: string;
  }>;
};

export const generateMetadata = async ({
  params,
}: StoriesLayoutProps): Promise<Metadata> => {
  const { locale } = await params;
  const _dictionary = await getDictionary(locale);

  return createMetadata({
    title: 'Stories - ZEKE Research Intelligence',
    description:
      'Browse AI research stories compressed from hours of content into verified insights with receipts.',
  });
};

const StoriesLayout = async ({ children, params }: StoriesLayoutProps) => {
  const { locale } = await params;
  const _dictionary = await getDictionary(locale);

  return <>{children}</>;
};

export default StoriesLayout;
