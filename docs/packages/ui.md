# UI Package

Shared React component library.

## Overview

| Property | Value |
|----------|-------|
| Package | `@zeke/ui` |
| Base | Radix UI primitives |
| Styling | Tailwind CSS |

## Usage

```typescript
import { Button } from "@zeke/ui/button";
import { Card, CardHeader, CardContent } from "@zeke/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@zeke/ui/dialog";
```

## Component Categories

### Layout

| Component | Description |
|-----------|-------------|
| `accordion` | Collapsible sections |
| `card` | Content container |
| `carousel` | Sliding content |
| `collapsible` | Toggle visibility |
| `navigation-menu` | Nav dropdown |
| `resizable` | Resizable panels |
| `separator` | Visual divider |
| `tabs` | Tab navigation |

### Forms

| Component | Description |
|-----------|-------------|
| `button` | Action button |
| `checkbox` | Boolean input |
| `input` | Text input |
| `textarea` | Multi-line input |
| `select` | Dropdown select |
| `radio-group` | Radio buttons |
| `switch` | Toggle switch |
| `slider` | Range input |
| `combobox` | Searchable select |

### Dialogs & Overlays

| Component | Description |
|-----------|-------------|
| `alert-dialog` | Confirmation dialog |
| `dialog` | Modal dialog |
| `drawer` | Side drawer |
| `sheet` | Bottom/side sheet |
| `popover` | Floating content |
| `hover-card` | Hover preview |
| `tooltip` | Hint text |
| `dropdown-menu` | Context menu |

### Data Display

| Component | Description |
|-----------|-------------|
| `table` | Data table |
| `badge` | Status badge |
| `progress` | Progress bar |
| `skeleton` | Loading placeholder |
| `avatar` | User avatar |

### Rich Content

| Component | Description |
|-----------|-------------|
| `editor` | Tiptap rich text |
| `markdown` | MD renderer |

### Feedback

| Component | Description |
|-----------|-------------|
| `toast` | Notifications |
| `spinner` | Loading spinner |
| `loading` | Loading states |

## Examples

### Button

```tsx
import { Button } from "@zeke/ui/button";

<Button variant="default">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button disabled>Disabled</Button>
```

### Card

```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from "@zeke/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### Dialog

```tsx
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@zeke/ui/dialog";

<Dialog>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
    Content here
    <DialogFooter>
      <Button>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Toast

```tsx
import { toast } from "@zeke/ui/toast";

// Success
toast.success("Changes saved");

// Error
toast.error("Something went wrong");

// Custom
toast("Custom message", {
  description: "Additional details",
  action: {
    label: "Undo",
    onClick: () => console.log("Undo"),
  },
});
```

### Table

```tsx
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@zeke/ui/table";

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Status</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Item 1</TableCell>
      <TableCell>Active</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

## Styling

### Tailwind Classes

```tsx
<Button className="w-full mt-4">Full Width</Button>
```

### Dark Mode

Components support dark mode automatically via Tailwind:

```css
/* Automatically applied */
.dark .bg-background { background: #0a0a0a; }
```

### Size Utilities

Use `size-*` when width equals height:

```tsx
// Prefer
<div className="size-4" />

// Instead of
<div className="h-4 w-4" />
```

## Icons

```tsx
import { Icons } from "@zeke/ui/icons";

<Icons.spinner className="size-4 animate-spin" />
<Icons.check className="size-4 text-green-500" />
<Icons.x className="size-4 text-red-500" />
```

## Directory Structure

```
packages/ui/src/
├── components/
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   └── ...
├── icons.tsx
├── globals.css
└── index.ts
```

## Related

- [Dashboard Application](../apps/dashboard.md)
- [Website Application](../apps/website.md)
