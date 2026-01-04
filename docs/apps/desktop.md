# Desktop Application

Thin desktop shell around the Dashboard. If you need product features, build them in the Dashboard + API first.

## Owns

- Native window chrome and sizing
- Deep linking and auto-updates
- Packaging for macOS/Windows/Linux

## Does Not Own

- Product UI (Dashboard owns that)
- Business logic (API owns that)

## Overview

| Property | Value |
|----------|-------|
| Framework | Tauri + React 19 |
| Entry | `apps/desktop/src/main.tsx` |
| Status | Development |

## Quick Start

```bash
bun run dev:desktop  # Start development
```

## Technology

- **Tauri**: Rust-based desktop framework
- **Vite**: Build tool
- **React 19**: UI framework

## Features

- Native window management
- Transparent titlebar (macOS)
- Deep linking support
- Auto-updater
- Minimum window: 1450x900

## Directory Structure

```
apps/desktop/
├── src/
│   ├── main.tsx        # React entry
│   ├── App.tsx         # Main component
│   └── components/
├── src-tauri/
│   ├── src/
│   │   └── main.rs     # Tauri entry
│   ├── tauri.conf.json # Tauri config
│   └── Cargo.toml
└── vite.config.ts
```

## Environment Modes

| Mode | URL |
|------|-----|
| Development | `ZEKE_APP_URL` or localhost |
| Staging | `https://beta.zekehq.com` |
| Production | `https://app.zekehq.com` |

Set via `ZEKE_ENV` environment variable.

## Build

```bash
# Development
bun run dev:desktop

# Production build
cd apps/desktop && bun run build

# Platform-specific
bun run build:macos
bun run build:windows
bun run build:linux
```

## Configuration

### Tauri Config

```json
// src-tauri/tauri.conf.json
{
  "build": {
    "devPath": "http://localhost:5173",
    "distDir": "../dist"
  },
  "tauri": {
    "windows": [{
      "title": "Zeke",
      "width": 1450,
      "height": 900,
      "minWidth": 1450,
      "minHeight": 900,
      "decorations": false,
      "transparent": true
    }]
  }
}
```

## Environment Variables

```bash
# Development mode
ZEKE_ENV=development
ZEKE_APP_URL=http://localhost:3001
```

## Related

- [Dashboard Application](./dashboard.md)
- [Desktop Client Package](../packages/utilities.md)
