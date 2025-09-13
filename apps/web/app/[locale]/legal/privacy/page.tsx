/**
 * Privacy Policy page with ZEKE branding
 */

import { Card, CardContent, CardHeader, CardTitle } from '@zeke/design-system/components/ui/card';
import { getDictionary } from '@zeke/internationalization';
import { createMetadata } from '@zeke/seo/metadata';
import type { Metadata } from 'next';
import { Shield, Eye, Lock, Trash2 } from 'lucide-react';

type PrivacyPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export const generateMetadata = async ({
  params,
}: PrivacyPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);

  return createMetadata({
    title: 'Privacy Policy - ZEKE',
    description: 'How ZEKE protects your data while helping you compress research from 10 hours to 5 minutes.',
  });
};

const PrivacyPage = async ({ params }: PrivacyPageProps) => {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);

  return (
    <div className="w-full">
      <div className="container mx-auto">
        {/* Hero Section */}
        <div className="flex flex-col items-center gap-8 py-20">
          <div className="flex flex-col gap-4 text-center">
            <h1 className="max-w-4xl font-regular text-4xl tracking-tighter md:text-5xl">
              Privacy Policy
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground leading-relaxed tracking-tight">
              How we protect your data while helping you turn research chaos into actionable insights
            </p>
          </div>
        </div>

        {/* Privacy Principles */}
        <div className="py-10">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Minimal Collection</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  We only collect what's needed to provide the service
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Eye className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">No Selling</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  We don't sell your personal information to anyone
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Secure Storage</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Your data is encrypted and securely stored
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Trash2 className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Your Control</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Request access, updates, or deletion anytime
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Policy Content */}
        <div className="py-10">
          <div className="mx-auto max-w-4xl">
            <Card>
              <CardContent className="prose prose-gray max-w-none p-8 dark:prose-invert">
                <h2>Our Approach to Privacy</h2>
                <p>
                  <strong>Minton Holdings LLC</strong> ("we", "us") operates ZEKE with a focus on helping you 
                  compress research from 10 hours to 5 minutes. We respect your privacy and are committed 
                  to protecting your personal data.
                </p>

                <h3>What We Collect</h3>
                <p>We collect only what's necessary to provide our research intelligence service:</p>
                <ul>
                  <li><strong>Account Information:</strong> Email, name, and subscription details</li>
                  <li><strong>Research Content:</strong> URLs and content you submit for analysis</li>
                  <li><strong>Usage Data:</strong> How you interact with briefs, playbooks, and outputs</li>
                  <li><strong>Technical Data:</strong> IP address, browser type, and device information</li>
                </ul>

                <h3>How We Use Your Data</h3>
                <p>Your data helps us deliver the core ZEKE experience:</p>
                <ul>
                  <li>Generate verified briefs and insights from your research content</li>
                  <li>Create role-aware takeaways and actionable playbooks</li>
                  <li>Improve our analysis algorithms and citation accuracy</li>
                  <li>Provide customer support and account management</li>
                  <li>Send service updates and feature announcements</li>
                </ul>

                <h3>Data Sharing</h3>
                <p>We don't sell your personal information. We may share data with:</p>
                <ul>
                  <li><strong>Service Providers:</strong> Supabase (database), Stripe (payments), and other infrastructure partners</li>
                  <li><strong>AI Providers:</strong> For content analysis (with appropriate safeguards)</li>
                  <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                </ul>

                <h3>Your Rights</h3>
                <p>You have control over your data:</p>
                <ul>
                  <li><strong>Access:</strong> Request a copy of your personal data</li>
                  <li><strong>Correction:</strong> Update inaccurate information</li>
                  <li><strong>Deletion:</strong> Request removal of your data</li>
                  <li><strong>Portability:</strong> Export your research briefs and playbooks</li>
                  <li><strong>Objection:</strong> Opt out of certain data processing</li>
                </ul>

                <h3>Data Security</h3>
                <p>
                  We implement appropriate technical and organizational measures to protect your data, 
                  including encryption in transit and at rest, access controls, and regular security audits.
                </p>

                <h3>Retention</h3>
                <p>
                  We retain your data as long as your account is active or as needed to provide services. 
                  Research content and generated briefs are kept to improve our algorithms, but can be 
                  deleted upon request.
                </p>

                <h3>Contact Us</h3>
                <p>
                  For data access, deletion requests, or privacy questions, contact us via our 
                  <a href="/contact" className="text-primary hover:underline"> Support page</a>.
                </p>

                <p className="text-sm text-muted-foreground">
                  <strong>Effective date:</strong> September 3, 2025<br />
                  <strong>Last updated:</strong> September 3, 2025
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
