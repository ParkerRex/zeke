# UI Package Agent Instructions

## Coding Preferences

- **Mirror existing component patterns**: wrap Radix primitives in `React.forwardRef`, pass through props, and layer variants via class-variance-authority helpers (cva) plus the shared `cn` utility
- **Keep styling Tailwind-first**; reach for design tokens defined in `globals.css` and avoid inline styles unless Radix requires them
- **Co-locate component-specific logic** with the component—hooks belong in `src/hooks/`, shared utilities under `src/utils/`, and only export primitives through package.json's map
- **When adding interactive pieces**, ensure keyboard/focus states stay intact; start from Radix components' recommended props and extend without breaking accessibility attributes
- **Reuse shared form/input primitives** where possible (`form.tsx`, `input.tsx`, `currency-input.tsx`); new field types should compose existing base components rather than re-styling from scratch
- **Keep CSS globals minimal**; prefer Tailwind plugin configuration (`tailwind.config.ts`) or component classes over new global selectors
- **Every new public export** should be added to `package.json` and, if theme-dependent, documented in `README.md`
// Relations
## Project Structure

```
packages/ui/
├── package.json                          # UI package metadata, scripts, and explicit export map for components/hooks/utilities
├── tsconfig.json                         # TypeScript config with UI-specific path aliases
├── postcss.config.js                     # PostCSS pipeline (Tailwind + autoprefixer) used during builds
├── tailwind.config.ts                    # Tailwind theme tokens, presets, and content configuration for the component library
├── README.md                             # Usage documentation, installation guidance, and theming notes
└── src/
    ├── globals.css                       # Global Tailwind layers and CSS variables defining the design system palette
    ├── utils/
    │   ├── cn.ts                         # Tailwind-friendly className merger (clsx + tailwind-merge)
    │   ├── truncate.ts                   # Text truncation helper for combining value+overflow state
    │   └── index.ts                      # Barrel export for shared utilities (cn, truncate)
    ├── hooks/
    │   ├── use-media-query.ts            # Hook bridging matchMedia queries with React state
    │   ├── use-resize-observer.ts        # Resize observer wrapper yielding element size updates
    │   ├── use-enter-submit.ts           # Form helper enabling Enter-to-submit while respecting textarea inputs
    │   └── index.ts                      # Barrel export for available hooks
    └── components/
        ├── accordion.tsx                 # Radix accordion wrapper with Zeke styling
        ├── alert-dialog.tsx              # Alert dialog primitives (trigger/content/actions) styled with Tailwind tokens
        ├── alert.tsx                     # Inline alert component variants (info/warning/etc.)
        ├── animated-size-container.tsx   # Auto-animating container that transitions height changes
        ├── avatar.tsx                    # Radix avatar wrapper with fallback initials support
        ├── badge.tsx                     # Label badge variants for status chips
        ├── button.tsx                    # Primary button primitive with variant and size cva
        ├── calendar.tsx                  # Date picker control built on react-day-picker with Tailwind styling
        ├── card.tsx                      # Card container primitives (header/content/footer)
        ├── carousel.tsx                  # Embla-powered carousel component with controls
        ├── chart.tsx                     # Recharts wrapper component with default theming
        ├── checkbox.tsx                  # Radix checkbox with accessible states and Tailwind classes
        ├── collapsible.tsx               # Radix collapsible shell for hide/show sections
        ├── combobox-dropdown.tsx         # Dropdown list UI used by combobox trigger
        ├── combobox.tsx                  # Headless command palette-powered combobox component
        ├── command.tsx                   # CMDK command palette wrapper with Zeke styling
        ├── context-menu.tsx              # Radix context menu primitives with themed styles
        ├── currency-input.tsx            # Controlled currency input masking built on react-number-format
        ├── date-range-picker.tsx         # Prebuilt range picker composed from calendar + popover
        ├── dialog.tsx                    # Radix dialog primitives styled for modal usage
        ├── drawer.tsx                    # Vaul drawer wrapper for slide-over panels
        ├── dropdown-menu.tsx             # Radix dropdown menu components with consistent sizing
        ├── form.tsx                      # React Hook Form helpers and wrapper components
        ├── hover-card.tsx                # Radix hover card with theme-aligned offsets
        ├── icons.tsx                     # Central icon exports (lucide + custom glyphs)
        ├── input-otp.tsx                 # OTP input built on `input-otp` with focus management
        ├── input.tsx                     # Base text input with variants for states and sizes
        ├── label.tsx                     # Form label component aligned with Tailwind tokens
        ├── multiple-selector.tsx         # Multi-select input using command palette UX
        ├── navigation-menu.tsx           # Radix navigation menu primitives with responsive styling
        ├── popover.tsx                   # Radix popover wrapper with shared animations
        ├── progress.tsx                  # Progress bar component themed for light/dark usage
        ├── quantity-input.tsx            # Stepper input for numeric quantities
        ├── radio-group.tsx               # Radix radio group styled to match design system
        ├── scroll-area.tsx               # Radix scroll area with custom scrollbar hides
        ├── select.tsx                    # Radix select components with trigger/content styling
        ├── separator.tsx                 # Radix separator for horizontal/vertical dividers
        ├── sheet.tsx                     # Radix sheet primitives for anchored overlays
        ├── skeleton.tsx                  # Animated skeleton loader blocks
        ├── slider.tsx                    # Radix slider with theming for single-range input
        ├── spinner.tsx                   # Simple loading spinner component
        ├── submit-button.tsx             # Form submit button that handles pending states
        ├── switch.tsx                    # Radix switch toggle styled to spec
        ├── table.tsx                     # Table primitives with consistent typography and spacing
        ├── tabs.tsx                      # Radix tabs with indicator styling
        ├── textarea.tsx                  # Multiline text input with shared focus styles
        ├── time-range-input.tsx          # Control for selecting a start/end time window
        ├── toast.tsx                     # Radix toast primitives wired to library theme
        ├── toaster.tsx                   # Toast viewport provider component
        ├── tooltip.tsx                   # Radix tooltip shell with fade animations
        ├── use-toast.tsx                 # Toast hook exporting `toast()` helper
        └── editor/
            └── index.tsx                 # Tiptap-based rich text editor with configured extensions (bold/link/placeholder/underline)
```

## Key Architecture Decisions

### Component Pattern
All components follow a consistent implementation pattern:
1. Wrap Radix UI primitives with `React.forwardRef`
2. Use CVA (class-variance-authority) for variant management
3. Merge classes using the `cn` utility
4. Pass through all props to maintain Radix functionality

Example pattern:
```tsx
const Button = React.forwardRef<
  React.ElementRef<typeof ButtonPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ButtonPrimitive.Root> &
    VariantProps<typeof buttonVariants>
>(({ className, variant, size, ...props }, ref) => (
  <ButtonPrimitive.Root
    ref={ref}
    className={cn(buttonVariants({ variant, size, className }))}
    {...props}
  />
));
```

### Styling Philosophy
- **Tailwind-first**: All styling uses Tailwind utility classes
- **Design tokens**: CSS variables in `globals.css` define the color palette
- **No inline styles**: Unless required by Radix for positioning/measurements
- **Theme support**: Components automatically adapt to light/dark themes

### Accessibility Standards
- All interactive components maintain keyboard navigation
- Focus states are always visible and themed
- ARIA attributes from Radix are preserved
- Screen reader support is maintained through semantic HTML

### Form Component Architecture
Form components build on shared primitives:
- `form.tsx` - React Hook Form integration
- `input.tsx` - Base input component
- `currency-input.tsx` - Specialized numeric input
- New form fields should compose these rather than starting from scratch

### Export Strategy
Components are explicitly exported through `package.json`:
```json
{
  "exports": {
    "./components/button": "./src/components/button.tsx",
    "./hooks": "./src/hooks/index.ts",
    "./utils": "./src/utils/index.ts"
  }
}
```

## Adding New Components

When creating a new component:

1. **Start with Radix primitive** if one exists for your use case
2. **Follow the forwardRef pattern** to maintain ref passing
3. **Use CVA for variants** instead of conditional classes
4. **Apply the cn utility** for className merging
5. **Test accessibility** - keyboard navigation, screen readers, focus states
6. **Add to package.json exports** for public consumption
7. **Document in README** if component has theme-dependent behavior

### Component Template
```tsx
import * as React from "react"
import * as PrimitiveName from "@radix-ui/react-primitive"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/utils"

const componentVariants = cva(
  "base-classes",
  {
    variants: {
      variant: {
        default: "default-classes",
        secondary: "secondary-classes",
      },
      size: {
        default: "size-default",
        sm: "size-sm",
        lg: "size-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const ComponentName = React.forwardRef<
  React.ElementRef<typeof PrimitiveName.Root>,
  React.ComponentPropsWithoutRef<typeof PrimitiveName.Root> &
    VariantProps<typeof componentVariants>
>(({ className, variant, size, ...props }, ref) => (
  <PrimitiveName.Root
    ref={ref}
    className={cn(componentVariants({ variant, size, className }))}
    {...props}
  />
))
ComponentName.displayName = "ComponentName"

export { ComponentName }
```

## Design System Tokens

The design system uses CSS variables defined in `globals.css`:
- `--background` / `--foreground` - Primary colors
- `--primary` / `--primary-foreground` - Brand colors
- `--muted` / `--muted-foreground` - Subtle elements
- `--accent` / `--accent-foreground` - Interactive highlights
- `--destructive` / `--destructive-foreground` - Error states
- `--border` - Border colors
- `--ring` - Focus ring colors
- `--radius` - Border radius tokens

## Common Utilities

### cn Utility
Merges Tailwind classes intelligently:
```tsx
cn("text-red-500", "text-blue-500") // Returns: "text-blue-500"
cn("p-4", conditional && "p-6") // Conditional classes
```

### Hooks
- `useMediaQuery` - Responsive behavior in JS
- `useResizeObserver` - Element size tracking
- `useEnterSubmit` - Form submission helpers

## Testing Considerations

When testing UI components:
- Test user interactions, not implementation details
- Verify accessibility attributes are present
- Check keyboard navigation works as expected
- Test variant and size combinations
- Ensure proper ref forwarding