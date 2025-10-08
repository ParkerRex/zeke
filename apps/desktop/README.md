# Zeke Desktop App

A Tauri-based desktop application for Zeke that supports multiple environments with a native transparent titlebar on macOS.

## Features

- **Environment Support**: Development, Staging, and Production environments
- **Transparent Titlebar**: Native macOS transparent titlebar with traffic light buttons
- **Responsive Design**: Minimum window size of 1450x900 for optimal experience

## Environment Configuration

Use `ZEKE_APP_URL` to point the desktop shell at the live dashboard. If the
variable is not provided, the app falls back to `https://app.zekehq.com`. Set
`ZEKE_ENV=staging` to automatically use `https://beta.zekehq.com`.

## Running the App

### Development Mode
```bash
# Run in development environment (loads ZEKE_APP_URL or the default remote app)
bun run tauri:dev
```

### Staging Mode
```bash
# Run in staging environment (loads beta.zekehq.com)
bun run tauri:staging
```

### Production Mode
```bash
# Run in production environment (loads app.zekehq.com)
bun run tauri:prod
```

## Building the App

### Development Build
```bash
bun run tauri:build
```

### Staging Build
```bash
bun run tauri:build:staging
```

### Production Build
```bash
bun run tauri:build:prod
```

## Environment Variable

The environment is controlled by the `ZEKE_ENV` environment variable:

- `staging` → `https://beta.zekehq.com`
- `production` or `prod` → `https://app.zekehq.com`
- any other value falls back to `ZEKE_APP_URL` or `https://app.zekehq.com`

Set `ZEKE_APP_URL` if you need to override the dashboard URL explicitly.

## Manual Environment Setting

You can also set the environment manually:

```bash
# macOS/Linux
ZEKE_ENV=staging tauri dev

# Windows (PowerShell)
$env:ZEKE_ENV="staging"; tauri dev

# Windows (Command Prompt)
set ZEKE_ENV=staging && tauri dev
```
