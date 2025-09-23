## Preferences

- Favor the shared base.json for new packages so strict mode, NodeNext modules, and DOM libs stay consistent across the monorepo.
- Extend nextjs.json for app routes and dashboard UI so Next.js-specific plugin wiring and noEmit are applied automatically.
- Extend react-library.json for reusable component packages that ship JSX; let build tooling control emit targets instead of overriding here.
- Keep overrides minimal and local—prefer compilerOptions.paths in the package-level tsconfig.json over editing the shared presets.
- Document any deviation from the presets in the package README so other teams understand the rationale.

## Navigation
```
packages/tsconfig/                      # Shared TypeScript configurations for the monorepo
├── base.json                           # Core TypeScript defaults shared by every package (strict, NodeNext, DOM libs, JSON imports)
├── nextjs.json                         # Adds Next.js plugin, Bundler resolution, JSX preserve, and disables emit for app/route code
├── react-library.json                  # Targets component libraries; keeps base defaults while enabling the modern react-jsx transform
└── package.json                        # Internal package manifest so other workspaces can depend on @midday/tsconfig
```