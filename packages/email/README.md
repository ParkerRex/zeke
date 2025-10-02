# @zeke/email

A comprehensive transactional email system built on React Email, providing beautifully designed, responsive email templates with dark mode support and internationalization.

## Architectural Insight

The email package's architecture reveals the challenges of modern email development: supporting both modern and legacy email clients requires inline styles, table-based layouts, and careful CSS feature selection. The React Email framework abstracts these complexities while the theme system ensures visual consistency across all transactional communications.

## Features

- **React-based templates** - Component-driven email development with type safety
- **Dark mode support** - Automatic theme switching for supported email clients
- **Legacy client compatibility** - Inline styles and table layouts for broad support
- **Internationalization** - Built-in i18n with English and Swedish translations
- **Reusable components** - Shared UI primitives (Button, Footer, Logo) for consistency
- **Theme system** - Centralized styling with `EmailThemeProvider`
- **Preview deployment** - Vercel integration for email template previews

## Installation

```bash
bun add @zeke/email
```

## Usage

```typescript
import { WelcomeEmail } from '@zeke/email/emails/welcome';
import { render } from '@zeke/email/render';

// Create email HTML
const html = await render(
  <WelcomeEmail 
    name="John Doe"
    email="john@example.com"
  />
);

// Send via your email service
await sendEmail({
  to: 'john@example.com',
  subject: 'Welcome to Zeke',
  html
});
```

## Template Structure

All email templates follow a consistent structure:

```tsx
import { EmailThemeProvider } from '../components/theme';
import { Button } from '../components/button';
import { Footer } from '../components/footer';

export function MyEmail({ name }: { name: string }) {
  return (
    <EmailThemeProvider>
      {/* Email content using React Email components */}
      <Button href="https://example.com">
        Call to Action
      </Button>
      <Footer />
    </EmailThemeProvider>
  );
}
```

## Available Templates

### Transactional
- `invoice.tsx` - Invoice delivery with payment CTA
- `invoice-paid.tsx` - Payment confirmation
- `invoice-reminder.tsx` - Payment reminder
- `invoice-overdue.tsx` - Overdue notice

### Authentication & Security
- `invite.tsx` - Team invitation
- `api-key-created.tsx` - API key generation alert

### Lifecycle
- `welcome.tsx` - New user onboarding
- `get-started.tsx` - Feature introduction
- `trial-expiring.tsx` - Trial expiration warning
- `trial-ended.tsx` - Trial completion

### Notifications
- `transactions.tsx` - Transaction digest
- `connection-issue.tsx` - Bank connection problems
- `connection-expire.tsx` - Connection expiration warning
- `app-installed.tsx` - Integration confirmation

## Internationalization

Add translations in `locales/translations.ts`:

```typescript
export const translations = {
  'email.welcome.title': {
    en: 'Welcome to Zeke',
    sv: 'Välkommen till Zeke'
  }
};
```

Use in templates:

```typescript
import { getI18n } from '../locales';

const t = getI18n(locale);
const title = t('email.welcome.title');
```

## Development

Preview emails locally:

```bash
bun dev
```

This starts the React Email development server where you can preview all templates with hot reloading.

## Best Practices

1. **Always use inline styles** - Many email clients strip `<style>` tags
2. **Test across clients** - Use tools like Litmus or Email on Acid
3. **Keep templates simple** - Complex layouts break in older clients
4. **Use semantic HTML** - Improves accessibility and deliverability
5. **Optimize images** - Use absolute URLs and provide alt text
6. **Include text version** - Some clients prefer plain text

## Testing

Test email rendering:

```bash
bun test
```

Preview in browser:

```bash
bun preview
```