# @zeke/desktop-client

A cross-platform desktop integration package that provides Tauri-based desktop features with graceful web fallbacks and platform-specific styling capabilities.

## Architectural Insight

The desktop-client package demonstrates a pattern of progressive enhancement - it provides desktop-specific features through Tauri while ensuring the application remains fully functional in web browsers. The Tailwind plugin for platform-specific styling allows CSS-based feature detection, enabling responsive design across different operating systems.

## Features

- **Progressive enhancement** - Desktop features with automatic web fallbacks
- **Platform detection** - Runtime detection of desktop vs web environment
- **Deep linking** - Handle custom protocol URLs in desktop apps
- **Platform-specific styling** - Tailwind variants for mac/windows/linux
- **Event system** - Unified event handling across Tauri and web
- **Type safety** - Full TypeScript support with explicit interfaces

## Installation

```bash
pnpm add @zeke/desktop-client
```

## Usage

### Platform Detection

```typescript
import { isTauri, getPlatform } from '@zeke/desktop-client';

if (isTauri()) {
  console.log('Running in desktop app');
  const platform = await getPlatform(); // 'darwin' | 'windows' | 'linux'
} else {
  console.log('Running in web browser');
}
```

### Deep Linking

```typescript
import { listenForDeepLinks } from '@zeke/desktop-client';

// Listen for deep links (e.g., myapp://open/document/123)
const cleanup = await listenForDeepLinks((url) => {
  console.log('Received deep link:', url);
  // Handle the deep link
});

// Cleanup when done
cleanup();
```

### Window Management

```typescript
import { getCurrentWindow, appWindow } from '@zeke/desktop-client';

// Only works in desktop context
if (isTauri()) {
  const window = getCurrentWindow();
  await window.setTitle('My App');
  await window.center();
}
```

### Platform-Specific Styling

```javascript
// tailwind.config.js
import { desktopVariants } from '@zeke/desktop-client';

module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  plugins: [
    desktopVariants, // Adds desktop:, mac:, windows:, linux: variants
  ],
};
```

```tsx
// Use platform-specific styles
<div className="p-4 desktop:p-6 mac:rounded-lg windows:shadow-md">
  <button className="web:bg-blue-500 desktop:bg-green-500">
    Platform-aware button
  </button>
</div>
```

## API

### Core Functions

#### `isTauri(): boolean`
Returns true if running in Tauri desktop context.

#### `getPlatform(): Promise<'darwin' | 'windows' | 'linux' | null>`
Gets the current operating system platform.

#### `listenForDeepLinks(callback: (url: string) => void): Promise<() => void>`
Registers a deep link handler and returns a cleanup function.

### Window API

#### `getCurrentWindow(): TauriWindow`
Gets the current Tauri window instance.

#### `appWindow: TauriWindow`
Direct export of the Tauri app window.

### Event System

#### `listen(event: string, callback: Function): Promise<UnlistenFn>`
Listen to custom events from Tauri.

#### `emit(event: string, payload?: any): Promise<void>`
Emit custom events to Tauri.

## Tailwind Plugin

The `desktopVariants` plugin adds the following CSS variants:

- `web:` - Applies only in web browsers
- `desktop:` - Applies only in desktop apps
- `mac:` - Applies only on macOS
- `windows:` - Applies only on Windows
- `linux:` - Applies only on Linux

These variants are applied based on classes added to the HTML root element.

## Best Practices

1. **Always check platform** - Use `isTauri()` before desktop-only features
2. **Provide fallbacks** - Ensure web users have alternative functionality
3. **Handle errors gracefully** - Desktop APIs may fail or be unavailable
4. **Clean up listeners** - Always call cleanup functions to prevent memory leaks
5. **Type everything** - Use TypeScript interfaces for better IDE support

## Environment Detection

The package automatically detects the environment:

```typescript
// Automatic detection
if (typeof window !== 'undefined' && window.__TAURI__) {
  // Desktop environment
} else {
  // Web environment
}
```

## Development

### Testing in Desktop Mode

```bash
# Run the Tauri development server
pnpm tauri dev
```

### Testing in Web Mode

```bash
# Run the web development server
pnpm dev
```

### Building

```bash
# Build for web
pnpm build:web

# Build for desktop
pnpm build:desktop
```

## Debugging

Enable debug logging:

```typescript
import { enableDebugMode } from '@zeke/desktop-client';

if (process.env.NODE_ENV === 'development') {
  enableDebugMode();
}
```

## Platform-Specific Features

### macOS
- Native window controls
- Vibrancy effects
- Touch Bar support

### Windows
- Windows-specific theming
- Taskbar integration
- Jump list support

### Linux
- GTK theming support
- System tray integration
- Desktop notifications