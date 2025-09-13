import { env } from '@/env';
import './styles.css';
import { AuthProvider } from '@zeke/auth/provider';
import { DesignSystemProvider } from '@zeke/design-system';
import { fonts } from '@zeke/design-system/lib/fonts';
import type { ReactNode } from 'react';

type RootLayoutProperties = {
  readonly children: ReactNode;
};

// TODO: Add nuqs back
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
          {children}
        </DesignSystemProvider>
      </AuthProvider>
    </body>
  </html>
);
