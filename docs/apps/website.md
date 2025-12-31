# Website Application

Marketing and public-facing website.

## Overview

| Property | Value |
|----------|-------|
| Port | 3000 |
| Framework | Next.js 15 |
| Entry | `apps/website/src/app` |

## Quick Start

```bash
bun run dev:website  # Start on port 3000
```

## Pages

| Route | Description |
|-------|-------------|
| `/` | Home/landing page |
| `/about` | About page |
| `/blog` | Blog listing |
| `/blog/[slug]` | Blog post |
| `/pricing` | Pricing page |
| `/terms` | Terms of service |
| `/policy` | Privacy policy |
| `/support` | Support page |

## Features

- **MDX Content**: Blog posts with MDX
- **SEO**: Meta tags, OpenGraph
- **Analytics**: OpenPanel integration
- **Animations**: Framer Motion

## Directory Structure

```
apps/website/src/
├── app/
│   ├── page.tsx           # Home page
│   ├── about/
│   ├── blog/
│   │   ├── page.tsx       # Blog listing
│   │   └── [slug]/        # Blog posts
│   ├── pricing/
│   ├── terms/
│   ├── policy/
│   └── support/
├── components/
│   ├── header.tsx
│   ├── footer.tsx
│   ├── hero.tsx
│   └── ...
├── content/
│   └── blog/              # MDX blog posts
└── lib/
```

## Blog Posts

Blog posts are MDX files in `content/blog/`:

```mdx
---
title: "Post Title"
date: "2024-01-01"
description: "Post description"
author: "Author Name"
---

# Content here

With **MDX** support.
```

## Styling

- Tailwind CSS
- Framer Motion for animations
- Custom components

## Environment Variables

```bash
# Analytics (optional)
NEXT_PUBLIC_OPENPANEL_CLIENT_ID=...

# API URL (for any API calls)
NEXT_PUBLIC_API_URL=http://localhost:3003
```

## Build

```bash
bun run build          # Production build
bun run start          # Start production server
```

## Related

- [Dashboard Application](./dashboard.md)
- [UI Package](../packages/ui.md)
