import { env } from '@/env';
import './styles.css';
import { AuthProvider } from '@zeke/auth/provider';
import { DesignSystemProvider } from '@zeke/design-system';
import { fonts } from '@zeke/design-system/lib/fonts';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import type { ReactNode } from 'react';

type RootLayoutProperties = {
  readonly children: ReactNode;
};

const RootLayout = ({ children }: RootLayoutProperties) => (
  <html lang="en" className={fonts} suppressHydrationWarning>
    <body>
      <AuthProvider
        privacyUrl={new URL(
          '/legal/privacy',
          env.NEXT_PUBLIC_WEB_URL
        ).toString()}
        termsUrl={new URL('/legal/terms', env.NEXT_PUBLIC_WEB_URL).toString()}
        helpUrl={env.NEXT_PUBLIC_DOCS_URL}
      >
        <DesignSystemProvider>
          <NuqsAdapter>{children}</NuqsAdapter>
        </DesignSystemProvider>
      </AuthProvider>
    </body>
  </html>
);

export default RootLayout;
