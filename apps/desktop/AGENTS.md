# Desktop App Preferences

## Coding Preferences
- Favor small, focused React components that read UI state from the desktop shell (Rust) via `@tauri-apps/api`. Keep side effects inside hooks and return declarative markup from `main.tsx`-level components.
- Type everything. Prefer explicit interfaces and discriminated unions for IPC payloads, and keep shared types in package modules (`packages/*`) so the desktop shell and web dashboard stay in sync.
- Surface new platform capabilities through Tauri commands. Define the command signature in Rust with `#[tauri::command]`, export a thin TypeScript wrapper, and document the event/command name in this file before wiring it through the UI.
- Guard multi-window behavior carefully. Centralize window creation in Rust (`lib.rs`), keep window state in a dedicated module, and make the front end request visibility changes instead of directly mutating global state.
- Follow repo-wide linting/formatting (`biome`, `tsconfig`, `rustfmt`). Do not commit generated artifacts; rely on scripts in `package.json` and `src-tauri/Cargo.toml` for builds.
- When adding native integrations, isolate external crates behind feature flags or modules so we can gate platform-specific behavior and mock it during tests.
- Keep telemetry and updater prompts user-first: always gate disruptive dialogs behind confirmation, and support silent failure paths that log to the console rather than panic.

## Layout Overview
The desktop app is split between a Vite-powered React renderer (`src/`) and the Tauri native shell (`src-tauri/`). Scripts in `package.json` orchestrate dev/build flows for each environment. Native configuration lives under `src-tauri`, including capability declarations, icons, and runtime configuration files.

```
apps/desktop/
├─ package.json                     # Node workspace manifest with Vite+Tauri scripts and dependencies
├─ src/
│  ├─ main.tsx                      # React entry point that mounts the renderer into the `root` element
│  └─ vite-env.d.ts                 # Ambient Vite/TypeScript declarations for the renderer build
├─ src-tauri/
│  ├─ .gitignore                    # Ignore rules for native build artifacts and generated files
│  ├─ Cargo.lock                    # Resolved Rust dependency graph for reproducible builds
│  ├─ Cargo.toml                    # Rust workspace manifest configuring Tauri, plugins, and features
│  ├─ build.rs                      # Custom build script invoked by Cargo during bundling
│  ├─ capabilities/
│  │  ├─ default.json               # Baseline capability set applied across all environments
│  │  └─ desktop.json               # Capability overrides tailored to the desktop distribution
│  ├─ icons/
│  │  ├─ dev/128x128.png            # Development app icon (128×128 PNG)
│  │  ├─ dev/128x128@2x.png         # Development app icon (Retina 256×256 PNG)
│  │  ├─ dev/32x32.png              # Development app icon (32×32 PNG)
│  │  ├─ dev/64x64.png              # Development app icon (64×64 PNG)
│  │  ├─ dev/icon.icns              # Development macOS icon bundle
│  │  ├─ dev/icon.ico               # Development Windows icon bundle
│  │  ├─ dev/icon.png               # Development general-purpose PNG icon
│  │  ├─ production/128x128.png     # Production app icon (128×128 PNG)
│  │  ├─ production/128x128@2x.png  # Production app icon (Retina 256×256 PNG)
│  │  ├─ production/32x32.png       # Production app icon (32×32 PNG)
│  │  ├─ production/64x64.png       # Production app icon (64×64 PNG)
│  │  ├─ production/icon.icns       # Production macOS icon bundle
│  │  ├─ production/icon.ico        # Production Windows icon bundle
│  │  ├─ production/icon.png        # Production general-purpose PNG icon
│  │  ├─ staging/128x128.png        # Staging app icon (128×128 PNG)
│  │  ├─ staging/128x128@2x.png     # Staging app icon (Retina 256×256 PNG)
│  │  ├─ staging/32x32.png          # Staging app icon (32×32 PNG)
│  │  ├─ staging/64x64.png          # Staging app icon (64×64 PNG)
│  │  ├─ staging/icon.icns          # Staging macOS icon bundle
│  │  ├─ staging/icon.ico           # Staging Windows icon bundle
│  │  ├─ staging/icon.png           # Staging general-purpose PNG icon
│  │  └─ tray-icon.png              # Shared tray icon displayed in the system status area
│  ├─ images/installer.png          # Graphic used in native installer flows
│  ├─ src/
│  │  ├─ lib.rs                     # Main Rust module orchestrating windows, commands, tray, and events
│  │  └─ main.rs                    # Tauri entry point bootstrapping the Rust application
│  ├─ tauri.conf.json               # Default Tauri configuration for production builds
│  ├─ tauri.dev.conf.json           # Development-specific Tauri configuration (e.g., dev server URL)
│  └─ tauri.staging.conf.json       # Staging-specific Tauri configuration settings
```

Keep this document close to the code: update the tree whenever files move, and expand the preferences section when new patterns or integrations land.
